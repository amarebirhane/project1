# app/crud/user.py
from typing import Optional, List
from sqlalchemy.orm import Session

from ..models.user import User, UserRole
from ..models.role import Role
from ..schemas.user import UserCreate, UserUpdate, RoleCreate, RoleUpdate
from ..core.security import get_password_hash, verify_password


# ------------------------------------------------------------------
# CRUD User
# ------------------------------------------------------------------
class CRUDUser:
    def get(self, db: Session, id: int) -> Optional[User]:
        return db.query(User).filter(User.id == id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    def get_subordinates(self, db: Session, manager_id: int) -> List[User]:
        """Get direct subordinates of a manager"""
        return db.query(User).filter(User.manager_id == manager_id).all()

    def get_hierarchy(self, db: Session, user_id: int) -> List[User]:
        """Get all subordinates recursively (full hierarchy)"""
        def recursive_subordinates(manager_id: int) -> List[User]:
            direct = self.get_subordinates(db, manager_id)
            result = []
            for sub in direct:
                result.append(sub)
                result.extend(recursive_subordinates(sub.id))
            return result
        return recursive_subordinates(user_id)

    def create(self, db: Session, obj_in: UserCreate) -> User:
        # Prevent duplicates
        if self.get_by_email(db, obj_in.email):
            raise ValueError("Email already registered")
        if self.get_by_username(db, obj_in.username):
            raise ValueError("Username already taken")

        hashed_password = get_password_hash(obj_in.password)
        db_user = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=hashed_password,
            full_name=obj_in.full_name,
            phone=obj_in.phone,
            role=obj_in.role,
            department=obj_in.department,
            is_active=getattr(obj_in, "is_active", True),
            manager_id=getattr(obj_in, "manager_id", None),
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    def update(self, db: Session, db_obj: User, obj_in: UserUpdate) -> User:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> User:
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def authenticate(self, db: Session, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.role == UserRole.SUPER_ADMIN


# ------------------------------------------------------------------
# CRUD Role
# ------------------------------------------------------------------
class CRUDRole:
    def get(self, db: Session, id: int) -> Optional[Role]:
        return db.query(Role).filter(Role.id == id).first()

    def get_by_name(self, db: Session, name: str) -> Optional[Role]:
        return db.query(Role).filter(Role.name == name).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
        return db.query(Role).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: RoleCreate) -> Role:
        db_role = Role(
            name=obj_in.name,
            description=obj_in.description,
            permissions=obj_in.permissions,
        )
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        return db_role

    def update(self, db: Session, db_obj: Role, obj_in: RoleUpdate) -> Role:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> Role:
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj


# ------------------------------------------------------------------
# Export instances
# ------------------------------------------------------------------
user = CRUDUser()
role = CRUDRole()