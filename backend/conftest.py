import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, get_db
from main import app


@pytest.fixture(scope="function")
def db_engine():
    db_url = "sqlite:///:memory:"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client(db_engine, db_session):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    original_routers = app.router.on_startup[:]
    app.router.on_startup = []
    original_shutdown = app.router.on_shutdown[:]
    app.router.on_shutdown = []

    try:
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c
    finally:
        app.router.on_startup = original_routers
        app.router.on_shutdown = original_shutdown
        app.dependency_overrides.clear()
