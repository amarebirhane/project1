from unittest.mock import MagicMock
from app.services.ml_forecasting import MLForecastingService

def test_arima_insufficient_data():
    service = MLForecastingService()
    db = MagicMock()
    # Mock _prepare_time_series_data to return a small dataframe
    df_small = pd.DataFrame({
        'date': pd.to_datetime(['2023-01-01', '2023-02-01']),
        'value': [100.0, 110.0]
    })
    
    with MagicMock() as mock_prepare:
        MLForecastingService._prepare_time_series_data = MagicMock(return_value=df_small)
        with pytest.raises(ValueError, match="Insufficient data"):
            MLForecastingService.train_arima_expenses(
                db=db,
                start_date=pd.Timestamp('2023-01-01'),
                end_date=pd.Timestamp('2023-12-31')
            )

def test_arima_empty_data():
    service = MLForecastingService()
    db = MagicMock()
    df_empty = pd.DataFrame()
    
    MLForecastingService._prepare_time_series_data = MagicMock(return_value=df_empty)
    with pytest.raises(ValueError, match="Insufficient data"):
        MLForecastingService.train_arima_expenses(
            db=db,
            start_date=pd.Timestamp('2023-01-01'),
            end_date=pd.Timestamp('2023-12-31')
        )

def test_load_nonexistent_model():
    service = MLForecastingService()
    with pytest.raises(FileNotFoundError):
        MLForecastingService.load_trained_model("revenue", "nonexistent_model")
