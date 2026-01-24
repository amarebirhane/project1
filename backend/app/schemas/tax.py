# app/schemas/tax.py
"""
Tax Configuration Schemas
Pydantic models for tax types and rates
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


# ============================================================================
# Tax Type Schemas
# ============================================================================

class TaxTypeBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=20, description="Unique tax type code (e.g., VAT, GST)")
    name: str = Field(..., min_length=1, max_length=100, description="Tax type name")
    description: Optional[str] = Field(None, description="Tax type description")
    is_active: bool = Field(True, description="Whether this tax type is active")


class TaxTypeCreate(TaxTypeBase):
    """Schema for creating a new tax type"""
    pass


class TaxTypeUpdate(BaseModel):
    """Schema for updating a tax type"""
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class TaxType(TaxTypeBase):
    """Schema for tax type response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Tax Rate Schemas
# ============================================================================

class TaxRateBase(BaseModel):
    tax_type_id: int = Field(..., description="ID of the tax type")
    name: str = Field(..., min_length=1, max_length=100, description="Tax rate name")
    rate_percentage: float = Field(..., ge=0, le=100, description="Tax rate percentage (0-100)")
    jurisdiction: Optional[str] = Field(None, max_length=100, description="Jurisdiction (country, state, region)")
    effective_from: datetime = Field(..., description="Effective start date")
    effective_to: Optional[datetime] = Field(None, description="Effective end date")
    is_default: bool = Field(False, description="Whether this is the default rate for the tax type")
    is_active: bool = Field(True, description="Whether this tax rate is active")


class TaxRateCreate(TaxRateBase):
    """Schema for creating a new tax rate"""
    pass


class TaxRateUpdate(BaseModel):
    """Schema for updating a tax rate"""
    tax_type_id: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    rate_percentage: Optional[float] = Field(None, ge=0, le=100)
    jurisdiction: Optional[str] = Field(None, max_length=100)
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class TaxRate(TaxRateBase):
    """Schema for tax rate response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: Optional[int] = None
    tax_type: TaxType  # Nested tax type information

    model_config = ConfigDict(from_attributes=True)
