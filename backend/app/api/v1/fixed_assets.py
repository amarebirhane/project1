from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...schemas import fixed_asset as schemas
from ...crud.fixed_asset import fixed_asset as crud
from ...services.fixed_asset import fixed_asset_service

router = APIRouter()

@router.get("/", response_model=List[schemas.FixedAsset])
def read_fixed_assets(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve fixed assets.
    """
    assets = crud.get_multi(db, skip=skip, limit=limit)
    return assets

@router.post("/", response_model=schemas.FixedAsset)
def create_fixed_asset(
    *,
    db: Session = Depends(get_db),
    asset_in: schemas.FixedAssetCreate,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Create new fixed asset.
    """
    return crud.create(db, obj_in=asset_in, created_by_id=current_user.id)

@router.get("/{asset_id}", response_model=schemas.FixedAsset)
def read_fixed_asset(
    *,
    db: Session = Depends(get_db),
    asset_id: int,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Get fixed asset by ID.
    """
    asset = crud.get(db, id=asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Fixed asset not found")
    return asset

@router.put("/{asset_id}", response_model=schemas.FixedAsset)
def update_fixed_asset(
    *,
    db: Session = Depends(get_db),
    asset_id: int,
    asset_in: schemas.FixedAssetUpdate,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Update a fixed asset.
    """
    asset = crud.get(db, id=asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Fixed asset not found")
    return crud.update(db, db_obj=asset, obj_in=asset_in)

@router.post("/{asset_id}/depreciate", response_model=schemas.DepreciationLog)
def depreciate_fixed_asset(
    *,
    db: Session = Depends(get_db),
    asset_id: int,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Run depreciation for a fixed asset for the current month.
    """
    log = fixed_asset_service.run_monthly_depreciation(db, asset_id=asset_id, current_user_id=current_user.id)
    if not log:
        raise HTTPException(
            status_code=400, 
            detail="Asset cannot be depreciated (already fully depreciated or inactive)"
        )
    return log

@router.delete("/{asset_id}", response_model=schemas.FixedAsset)
def delete_fixed_asset(
    *,
    db: Session = Depends(get_db),
    asset_id: int,
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Delete a fixed asset. Only Admin.
    """
    asset = crud.get(db, id=asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Fixed asset not found")
    return crud.remove(db, id=asset_id)
