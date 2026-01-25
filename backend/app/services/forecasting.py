from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Any, Optional

from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine
from ..models.account import Account, AccountType

from ..models.payroll import EmployeeProfile
from ..models.fixed_asset import FixedAsset

class ForecastingService:
    @staticmethod
    def get_cash_flow_forecast(db: Session, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """
        Generate cash flow forecast for the next N days based on historical data.
        Integrates "Planned" recurring items from Payroll and Fixed Assets.
        """
        # 1. Fetch historical daily cash flow
        results = (
            db.query(
                func.date(AccountingJournalEntry.entry_date).label('date'),
                func.sum(JournalEntryLine.credit_amount - JournalEntryLine.debit_amount).label('net_amount')
            )
            .join(JournalEntryLine)
            .join(Account)
            .filter(Account.account_type.in_([AccountType.REVENUE, AccountType.EXPENSE])) 
            .group_by(func.date(AccountingJournalEntry.entry_date))
            .order_by('date')
            .all()
        )
        
        # 2. Calculate recurring payroll costs
        # Total monthly base salary for all active employees
        total_monthly_payroll = db.query(func.sum(EmployeeProfile.base_salary)).filter(
            EmployeeProfile.status == "active"
        ).scalar() or 0.0

        # Assuming payroll is paid at end of month or every 30 days
        # Just for simulation, we'll put it in the next few days if it's nearing end of month
        
        # 3. Handle data for ML
        if len(results) < 5:
            # If no historical data, start with projections from today
            df = pd.DataFrame(columns=['date', 'net_amount'])
            last_date = datetime.now()
        else:
            df = pd.DataFrame(results, columns=['date', 'net_amount'])
            df['date'] = pd.to_datetime(df['date'])
            df['day_ordinal'] = df['date'].map(datetime.toordinal)
            
            # Train Model
            X = df[['day_ordinal']]
            y = df['net_amount']
            model = LinearRegression()
            model.fit(X, y)
            
            last_date = df['date'].max()

        future_dates = [last_date + timedelta(days=x) for x in range(1, days_ahead + 1)]
        
        forecast = []
        if len(results) >= 5:
            future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
            predictions = model.predict(future_ordinals)
        else:
            predictions = [0.0] * days_ahead

        for d, pred in zip(future_dates, predictions):
            daily_amount = float(pred)
            
            # Simple logic: If it's the 28th of the month, subtract payroll
            # (In a real system, we'd check actual payroll payment dates)
            is_payroll_day = d.day == 28
            if is_payroll_day:
                daily_amount -= total_monthly_payroll
            
            forecast.append({
                "date": d.strftime("%Y-%m-%d"),
                "predicted_amount": round(daily_amount, 2),
                "type": "forecast",
                "is_planned": is_payroll_day,
                "note": "Includes Recurring Payroll" if is_payroll_day else None
            })
        
        return forecast

    @staticmethod
    def _fetch_historical_data(
        db: Session,
        forecast_type: str,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[Any] = None
    ) -> pd.DataFrame:
        """Helper to fetch and prepare historical data for forecasting"""
        # For simplicity, we'll try to use the logic from MLForecastingService if possible
        # but since we want to avoid circular imports, we'll implement a basic version
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            from ..models.revenue import RevenueEntry
            from ..models.expense import ExpenseEntry
            
            logger.info(f"Fetching historical data for {forecast_type} from {start_date} to {end_date}")
            
            data_points = []
            dates = []
            
            if forecast_type in ["revenue", "all"]:
                expenses_query = db.query(RevenueEntry).filter(
                    RevenueEntry.date >= start_date,
                    RevenueEntry.date <= end_date,
                    RevenueEntry.is_approved == True
                )
                logger.info(f"Querying revenue entries...")
                revenues = expenses_query.all()
                logger.info(f"Found {len(revenues)} revenue entries")
                
                for r in revenues:
                    data_points.append(float(r.amount))
                    dates.append(r.date)
                    
            if forecast_type in ["expense", "all"]:
                expenses_query = db.query(ExpenseEntry).filter(
                    ExpenseEntry.date >= start_date,
                    ExpenseEntry.date <= end_date,
                    ExpenseEntry.is_approved == True
                )
                logger.info(f"Querying expense entries...")
                expenses = expenses_query.all()
                logger.info(f"Found {len(expenses)} expense entries")
                
                for e in expenses:
                    # If "all", we might want to distinguish or net them, but usually 
                    # forecast_type is specific for these methods.
                    val = float(e.amount)
                    if forecast_type == "all":
                        # Net flow
                        data_points.append(-val)
                    else:
                        data_points.append(val)
                    dates.append(e.date)
            
            if not data_points:
                logger.info("No data points found")
                return pd.DataFrame(columns=['date', 'value'])
                
            logger.info(f"Creating DataFrame with {len(data_points)} points")
            # Ensure dates are compatible
            try:
                # Convert to UTC-aware datetime
                formatted_dates = []
                for d in dates:
                    if isinstance(d, datetime):
                        if d.tzinfo is None:
                            formatted_dates.append(d.replace(tzinfo=timezone.utc))
                        else:
                            formatted_dates.append(d.astimezone(timezone.utc))
                    else:
                        # Assuming it's a date object
                        formatted_dates.append(datetime(d.year, d.month, d.day, tzinfo=timezone.utc))
                
                df = pd.DataFrame({'date': formatted_dates, 'value': data_points})
                df['date'] = pd.to_datetime(df['date'], utc=True)
                df = df.groupby(df['date'].dt.to_period('M'))['value'].sum().reset_index()
                df['date'] = df['date'].dt.to_timestamp()
                df = df.sort_values('date')
                
                logger.info("Historical data prepared successfully")
                return df
            except Exception as e:
                logger.error(f"Error processing DataFrame: {e}", exc_info=True)
                return pd.DataFrame(columns=['date', 'value'])
                
        except Exception as e:
            logger.error(f"Error in _fetch_historical_data: {e}", exc_info=True)
            return pd.DataFrame(columns=['date', 'value'])

    @staticmethod
    def generate_moving_average_forecast(
        db: Session,
        forecast_type: str,
        start_date: datetime,
        end_date: datetime,
        hist_start: datetime,
        hist_end: datetime,
        window: int = 3,
        user_id: Optional[int] = None,
        user_role: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """Generate forecast using moving average"""
        df = ForecastingService._fetch_historical_data(db, forecast_type, hist_start, hist_end, user_id, user_role)
        
        if len(df) < window:
            # Fallback if not enough data
            avg_val = df['value'].mean() if not df.empty else 0.0
        else:
            avg_val = df['value'].iloc[-window:].mean()
            
        # Project forward
        forecast_data = []
        current_date = start_date
        period_idx = 1
        
        while current_date <= end_date:
            forecast_data.append({
                "period": f"Period {period_idx}",
                "date": current_date.strftime("%Y-%m-%d"),
                "forecasted_value": round(float(avg_val), 2),
                "method": "moving_average"
            })
            # Advance by one month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
            period_idx += 1
            
        return forecast_data

    @staticmethod
    def generate_linear_growth_forecast(
        db: Session,
        forecast_type: str,
        start_date: datetime,
        end_date: datetime,
        hist_start: datetime,
        hist_end: datetime,
        growth_rate: float = 0.05,
        user_id: Optional[int] = None,
        user_role: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """Generate forecast using linear growth"""
        df = ForecastingService._fetch_historical_data(db, forecast_type, hist_start, hist_end, user_id, user_role)
        
        last_val = df['value'].iloc[-1] if not df.empty else 1000.0  # Default if no data
        
        forecast_data = []
        current_date = start_date
        period_idx = 1
        
        while current_date <= end_date:
            last_val *= (1 + growth_rate)
            forecast_data.append({
                "period": f"Period {period_idx}",
                "date": current_date.strftime("%Y-%m-%d"),
                "forecasted_value": round(float(last_val), 2),
                "method": "linear_growth"
            })
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
            period_idx += 1
            
        return forecast_data

    @staticmethod
    def generate_trend_forecast(
        db: Session,
        forecast_type: str,
        start_date: datetime,
        end_date: datetime,
        hist_start: datetime,
        hist_end: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """Generate forecast using linear trend regression"""
        df = ForecastingService._fetch_historical_data(db, forecast_type, hist_start, hist_end, user_id, user_role)
        
        if len(df) < 2:
            return ForecastingService.generate_moving_average_forecast(db, forecast_type, start_date, end_date, hist_start, hist_end, 1, user_id, user_role)
            
        X = np.arange(len(df)).reshape(-1, 1)
        y = df['value'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        forecast_data = []
        current_date = start_date
        period_idx = 1
        
        # Start prediction index from the end of historical data
        future_idx = len(df)
        
        while current_date <= end_date:
            pred = model.predict([[future_idx]])[0]
            forecast_data.append({
                "period": f"Period {period_idx}",
                "date": current_date.strftime("%Y-%m-%d"),
                "forecasted_value": round(float(pred), 2),
                "method": "trend"
            })
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
            period_idx += 1
            future_idx += 1
            
        return forecast_data

forecasting_service = ForecastingService()
