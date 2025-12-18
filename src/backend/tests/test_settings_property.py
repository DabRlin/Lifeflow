"""
Property-based tests for Settings Round-Trip Consistency.

**Feature: lifeflow, Property 1: Settings Round-Trip Consistency**
**Validates: Requirements 1.3**
"""
import asyncio
from hypothesis import given, strategies as st, settings as hypothesis_settings, HealthCheck
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.database import Base
from app.models.setting import Setting


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# Strategy for generating valid setting keys (non-empty, printable strings)
valid_setting_key = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N'), whitelist_characters='_-'),
    min_size=1,
    max_size=50
).filter(lambda x: x.strip() and x.isascii())

# Strategy for generating valid setting values (any text, including empty)
valid_setting_value = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S', 'Z'), whitelist_characters=' '),
    min_size=0,
    max_size=500
).filter(lambda x: all(ord(c) < 65536 for c in x))  # Ensure valid unicode


async def run_round_trip_test(key: str, value: str) -> None:
    """
    Helper function to run the round-trip test with a fresh database session.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        # Create and save a setting
        setting = Setting(key=key, value=value)
        session.add(setting)
        await session.commit()
        
        # Load the setting back from database
        result = await session.execute(
            select(Setting).where(Setting.key == key)
        )
        loaded_setting = result.scalar_one_or_none()
        
        # Verify round-trip consistency
        assert loaded_setting is not None, f"Setting with key '{key}' should exist after save"
        assert loaded_setting.key == key, f"Key should match: expected '{key}', got '{loaded_setting.key}'"
        assert loaded_setting.value == value, f"Value should match: expected '{value}', got '{loaded_setting.value}'"
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


class TestSettingsRoundTrip:
    """
    **Feature: lifeflow, Property 1: Settings Round-Trip Consistency**
    
    For any valid settings object, saving the settings to the database 
    and then loading them should produce an equivalent settings object.
    """

    @hypothesis_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @given(key=valid_setting_key, value=valid_setting_value)
    def test_settings_round_trip_consistency(self, key: str, value: str):
        """
        **Feature: lifeflow, Property 1: Settings Round-Trip Consistency**
        **Validates: Requirements 1.3**
        
        Property: For any valid key-value pair, saving to database and loading
        should return the same values.
        """
        asyncio.get_event_loop().run_until_complete(run_round_trip_test(key, value))
