from fastapi import APIRouter, Depends, HTTPException, status # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List
from pydantic import BaseModel # type: ignore[import-untyped]
from urllib.parse import unquote
import logging

from ...core.database import get_db
from ...models.user import User, UserRole
from ...models.department import Department
from ...api.deps import get_current_active_user, require_min_role
from ...core.security import verify_password

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("")
def get_departments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all departments - returns unique departments from users"""
    # Extract unique departments from users
    departments = db.query(User.department).filter(
        User.department.isnot(None),
        User.department != ""
    ).distinct().all()
    
    # Format response
    result = []
    for (dept,) in departments:
        user_count = db.query(User).filter(
            User.department == dept,
            User.is_active == True
        ).count()
        
        # Try to get department metadata (description) from Department table
        dept_metadata = db.query(Department).filter(Department.name == dept).first()
        description = dept_metadata.description if dept_metadata else f"{dept} department"
        
        result.append({
            "id": dept.lower().replace(" ", "_"),
            "name": dept,
            "description": description,
            "user_count": user_count,
            "created_at": dept_metadata.created_at.isoformat() if dept_metadata and dept_metadata.created_at else None,
            "updated_at": dept_metadata.updated_at.isoformat() if dept_metadata and dept_metadata.updated_at else None
        })
    
    return result


@router.get("/{department_id}")
def get_department(
    department_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific department"""
    # Decode URL-encoded department ID
    decoded_id = unquote(department_id)
    
    # Try multiple formats to match department name
    # Format 1: Replace underscores with spaces and title case
    dept_name_v1 = decoded_id.replace("_", " ").title()
    # Format 2: Replace underscores with spaces and keep original case
    dept_name_v2 = decoded_id.replace("_", " ")
    # Format 3: Try exact match with decoded ID
    dept_name_v3 = decoded_id
    
    # First, try to find the department by checking all unique department names
    all_departments = db.query(User.department).filter(
        User.department.isnot(None),
        User.department != ""
    ).distinct().all()
    
    # Find matching department name (case-insensitive)
    matching_dept_name = None
    for (dept,) in all_departments:
        if dept and (
            dept.lower() == dept_name_v1.lower() or
            dept.lower() == dept_name_v2.lower() or
            dept.lower() == dept_name_v3.lower() or
            dept.lower().replace(" ", "_") == decoded_id.lower()
        ):
            matching_dept_name = dept
            break
    
    if not matching_dept_name:
        # Log available departments for debugging
        available_depts = [dept for (dept,) in all_departments if dept]
        logger.warning(f"Department not found. ID: {department_id}, Decoded: {decoded_id}, Available: {available_depts}")
        raise HTTPException(
            status_code=404, 
            detail=f"Department not found. The department '{decoded_id}' does not exist or has no users."
        )
    
    # Get users with the matching department name
    users = db.query(User).filter(
        User.department == matching_dept_name,
        User.is_active == True
    ).all()
    
    if not users:
        logger.warning(f"Department '{matching_dept_name}' exists but has no active users")
        raise HTTPException(
            status_code=404, 
            detail=f"Department '{matching_dept_name}' has no active users."
        )
    
    # Generate the ID from the actual department name (consistent with list endpoint)
    dept_id = matching_dept_name.lower().replace(" ", "_")
    
    # Try to get department metadata (description) from Department table
    dept_metadata = db.query(Department).filter(Department.name == matching_dept_name).first()
    description = dept_metadata.description if dept_metadata else f"{matching_dept_name} department"
    
    return {
        "id": dept_id,
        "name": matching_dept_name,
        "description": description,
        "user_count": len(users),
        "users": [{"id": u.id, "name": u.full_name or u.username, "email": u.email} for u in users],
        "created_at": dept_metadata.created_at.isoformat() if dept_metadata and dept_metadata.created_at else None,
        "updated_at": dept_metadata.updated_at.isoformat() if dept_metadata and dept_metadata.updated_at else None
    }


@router.post("")
def create_department(
    department_data: dict,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create department - departments are managed via user.department field"""
    name = department_data.get("name", "").strip()
    if not name or len(name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Department name must be at least 2 characters"
        )
    
    # Check if department already exists
    existing = db.query(User.department).filter(
        User.department == name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Department '{name}' already exists"
        )
    
    # Department is created implicitly when users are assigned to it
    # Return success response
    dept_id = name.lower().replace(" ", "_")
    return {
        "id": dept_id,
        "name": name,
        "description": department_data.get("description", f"{name} department"),
        "user_count": 0,
        "created_at": None,
        "updated_at": None,
        "message": "Department created. Assign users to this department to activate it."
    }


@router.put("/{department_id}")
def update_department(
    department_id: str,
    department_data: dict,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Update department - updates department name for all users in that department"""
    # Decode URL-encoded department ID
    decoded_id = unquote(department_id)
    
    # Try multiple formats to match department name (same logic as get_department)
    dept_name_v1 = decoded_id.replace("_", " ").title()
    dept_name_v2 = decoded_id.replace("_", " ")
    dept_name_v3 = decoded_id
    
    # Find matching department name (case-insensitive)
    all_departments = db.query(User.department).filter(
        User.department.isnot(None),
        User.department != ""
    ).distinct().all()
    
    matching_dept_name = None
    for (dept,) in all_departments:
        if dept and (
            dept.lower() == dept_name_v1.lower() or
            dept.lower() == dept_name_v2.lower() or
            dept.lower() == dept_name_v3.lower() or
            dept.lower().replace(" ", "_") == decoded_id.lower()
        ):
            matching_dept_name = dept
            break
    
    if not matching_dept_name:
        logger.warning(f"Department not found for update. ID: {department_id}, Decoded: {decoded_id}")
        raise HTTPException(
            status_code=404,
            detail=f"Department not found. The department '{decoded_id}' does not exist or has no users."
        )
    
    old_dept_name = matching_dept_name
    new_name = department_data.get("name", "").strip()
    
    if not new_name or len(new_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Department name must be at least 2 characters"
        )
    
    # Check if users exist with old department name
    users = db.query(User).filter(User.department == old_dept_name).all()
    
    if not users:
        raise HTTPException(
            status_code=404,
            detail=f"Department '{old_dept_name}' has no users"
        )
    
    # Check if new name already exists (and is different)
    if new_name.lower() != old_dept_name.lower():
        existing = db.query(User).filter(User.department == new_name).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Department '{new_name}' already exists"
            )
    
    # Update department name for all users
    for user in users:
        user.department = new_name
    db.commit()
    
    # Update or create department metadata (description)
    # First check if metadata exists for the old name
    dept_metadata = db.query(Department).filter(Department.name == old_dept_name).first()
    
    if dept_metadata:
        # Update existing metadata
        if new_name != old_dept_name:
            dept_metadata.name = new_name
        # Update description if provided, otherwise keep existing
        new_description = department_data.get("description")
        if new_description is not None:
            dept_metadata.description = new_description
    else:
        # Create new metadata
        dept_metadata = Department(
            name=new_name,
            description=department_data.get("description", f"{new_name} department")
        )
        db.add(dept_metadata)
    
    db.commit()
    
    new_dept_id = new_name.lower().replace(" ", "_")
    return {
        "id": new_dept_id,
        "name": new_name,
        "description": dept_metadata.description or f"{new_name} department",
        "user_count": len(users),
        "message": f"Department updated from '{old_dept_name}' to '{new_name}'"
    }


class DeleteDepartmentRequest(BaseModel):
    password: str

@router.post("/{department_id}/delete")
def delete_department(
    department_id: str,
    delete_request: DeleteDepartmentRequest,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete department - note: This removes department from users but doesn't delete users. Requires password verification."""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before deletion
    if not delete_request.password or not delete_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to delete a department."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this department."
        )
    
    dept_name = department_id.replace("_", " ").title()
    
    # Remove department from users
    users = db.query(User).filter(User.department == dept_name).all()
    for user in users:
        user.department = None
    db.commit()
    
    return {"message": f"Department '{dept_name}' removed from users"}

