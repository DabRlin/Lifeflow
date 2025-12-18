"""
Property-based tests for Notification System.

**Feature: notification-system, Property 6: Notification persistence round-trip**
**Validates: Requirements 4.1**
"""
import asyncio
import uuid
from datetime import datetime
from hypothesis import given, strategies as st, settings as hypothesis_settings, HealthCheck
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.database import Base
from app.models.notification import Notification


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


# Strategy for generating valid notification types
valid_notification_type = st.sampled_from(['habit_reminder', 'achievement', 'daily_complete', 'system'])

# Strategy for generating valid titles (non-empty strings)
valid_title = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P'), whitelist_characters=' _-'),
    min_size=1,
    max_size=100
).filter(lambda x: x.strip())

# Strategy for generating valid messages
valid_message = st.text(
    alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'S', 'Z'), whitelist_characters=' '),
    min_size=0,
    max_size=500
).filter(lambda x: all(ord(c) < 65536 for c in x))

# Strategy for generating notification data
valid_data = st.one_of(
    st.none(),
    st.fixed_dictionaries({
        'habit_id': st.text(min_size=1, max_size=36),
        'habit_title': st.text(min_size=1, max_size=50),
    }),
    st.fixed_dictionaries({
        'streak': st.integers(min_value=1, max_value=1000),
        'milestone': st.sampled_from([7, 14, 30, 60, 100]),
    }),
)

# Strategy for is_read boolean
valid_is_read = st.booleans()


async def run_notification_round_trip_test(
    notification_type: str,
    title: str,
    message: str,
    data: dict | None,
    is_read: bool
) -> None:
    """
    Helper function to run the notification round-trip test.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    notification_id = str(uuid.uuid4())
    
    async with async_session_maker() as session:
        # Create and save a notification
        notification = Notification(
            id=notification_id,
            type=notification_type,
            title=title,
            message=message,
            data=data,
            is_read=is_read,
            created_at=datetime.utcnow(),
            user_id="default"
        )
        session.add(notification)
        await session.commit()
        
        # Load the notification back from database
        result = await session.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        loaded = result.scalar_one_or_none()
        
        # Verify round-trip consistency
        assert loaded is not None, f"Notification with id '{notification_id}' should exist after save"
        assert loaded.id == notification_id, f"ID should match"
        assert loaded.type == notification_type, f"Type should match: expected '{notification_type}', got '{loaded.type}'"
        assert loaded.title == title, f"Title should match: expected '{title}', got '{loaded.title}'"
        assert loaded.message == message, f"Message should match"
        assert loaded.data == data, f"Data should match: expected '{data}', got '{loaded.data}'"
        assert loaded.is_read == is_read, f"is_read should match: expected '{is_read}', got '{loaded.is_read}'"
        assert loaded.created_at is not None, "created_at should have a valid timestamp"
        assert loaded.user_id == "default", f"user_id should be 'default'"
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


class TestNotificationPersistence:
    """
    **Feature: notification-system, Property 6: Notification persistence round-trip**
    
    For any valid notification, creating it and then querying by ID should 
    return an equivalent notification with a valid timestamp.
    """

    @hypothesis_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @given(
        notification_type=valid_notification_type,
        title=valid_title,
        message=valid_message,
        data=valid_data,
        is_read=valid_is_read
    )
    def test_notification_persistence_round_trip(
        self,
        notification_type: str,
        title: str,
        message: str,
        data: dict | None,
        is_read: bool
    ):
        """
        **Feature: notification-system, Property 6: Notification persistence round-trip**
        **Validates: Requirements 4.1**
        
        Property: For any valid notification, saving to database and loading
        should return the same values with a valid timestamp.
        """
        asyncio.get_event_loop().run_until_complete(
            run_notification_round_trip_test(notification_type, title, message, data, is_read)
        )



async def run_notification_ordering_test(notification_count: int) -> None:
    """
    Helper function to test notification ordering.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    import time
    
    async with async_session_maker() as session:
        # Create notifications with different timestamps
        created_ids = []
        for i in range(notification_count):
            notification_id = str(uuid.uuid4())
            notification = Notification(
                id=notification_id,
                type='system',
                title=f'Test {i}',
                message=f'Message {i}',
                data=None,
                is_read=False,
                created_at=datetime.utcnow(),
                user_id="default"
            )
            session.add(notification)
            created_ids.append(notification_id)
            await session.flush()
            # Small delay to ensure different timestamps
            time.sleep(0.001)
        
        await session.commit()
        
        # Query notifications ordered by created_at descending
        result = await session.execute(
            select(Notification).order_by(Notification.created_at.desc())
        )
        notifications = result.scalars().all()
        
        # Verify ordering: each notification should have created_at >= next one
        for i in range(len(notifications) - 1):
            assert notifications[i].created_at >= notifications[i + 1].created_at, \
                f"Notifications should be ordered by created_at descending"
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


class TestNotificationOrdering:
    """
    **Feature: notification-system, Property 7: Notification ordering**
    
    For any list of notifications returned by the API, they should be sorted 
    by created_at in descending order (newest first).
    """

    @hypothesis_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @given(notification_count=st.integers(min_value=2, max_value=20))
    def test_notification_ordering(self, notification_count: int):
        """
        **Feature: notification-system, Property 7: Notification ordering**
        **Validates: Requirements 4.3**
        
        Property: Notifications should be returned in descending order by created_at.
        """
        asyncio.get_event_loop().run_until_complete(
            run_notification_ordering_test(notification_count)
        )



from app.services.notification_service import NotificationService, ACHIEVEMENT_MILESTONES


async def run_achievement_generation_test(streak: int, habit_title: str) -> None:
    """
    Helper function to test achievement notification generation.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        service = NotificationService(session)
        habit_id = str(uuid.uuid4())
        
        # Generate achievement notification
        notification = await service.check_streak_achievement(
            habit_id=habit_id,
            streak=streak,
            habit_title=habit_title
        )
        
        if streak in ACHIEVEMENT_MILESTONES:
            # Should generate notification for milestone streaks
            assert notification is not None, f"Should generate notification for milestone {streak}"
            assert notification.type == 'achievement', "Type should be 'achievement'"
            assert notification.data['streak'] == streak, f"Streak should be {streak}"
            assert notification.data['milestone'] == streak, f"Milestone should be {streak}"
            assert notification.data['habit_id'] == habit_id, "habit_id should match"
            
            # Try to generate again - should return None (no duplicate)
            duplicate = await service.check_streak_achievement(
                habit_id=habit_id,
                streak=streak,
                habit_title=habit_title
            )
            assert duplicate is None, "Should not generate duplicate achievement notification"
        else:
            # Should not generate notification for non-milestone streaks
            assert notification is None, f"Should not generate notification for non-milestone {streak}"
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


class TestAchievementGeneration:
    """
    **Feature: notification-system, Property 2: Achievement notification generation**
    
    For any habit that reaches a milestone streak value (7, 14, 30, 60, 100), 
    the system should generate exactly one achievement notification for that milestone.
    """

    @hypothesis_settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @given(
        streak=st.integers(min_value=1, max_value=150),
        habit_title=valid_title
    )
    def test_achievement_notification_generation(self, streak: int, habit_title: str):
        """
        **Feature: notification-system, Property 2: Achievement notification generation**
        **Validates: Requirements 2.1**
        
        Property: Achievement notifications should only be generated for milestone streaks,
        and exactly one notification per milestone.
        """
        asyncio.get_event_loop().run_until_complete(
            run_achievement_generation_test(streak, habit_title)
        )



async def run_unread_count_accuracy_test(
    read_count: int,
    unread_count: int
) -> None:
    """
    Helper function to test unread count accuracy.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        # Create read notifications
        for i in range(read_count):
            notification = Notification(
                id=str(uuid.uuid4()),
                type='system',
                title=f'Read {i}',
                message='',
                data=None,
                is_read=True,
                created_at=datetime.utcnow(),
                user_id="default"
            )
            session.add(notification)
        
        # Create unread notifications
        for i in range(unread_count):
            notification = Notification(
                id=str(uuid.uuid4()),
                type='system',
                title=f'Unread {i}',
                message='',
                data=None,
                is_read=False,
                created_at=datetime.utcnow(),
                user_id="default"
            )
            session.add(notification)
        
        await session.commit()
        
        # Count unread notifications
        from sqlalchemy import func
        result = await session.execute(
            select(func.count(Notification.id)).where(Notification.is_read == False)
        )
        actual_unread = result.scalar() or 0
        
        # Verify accuracy
        assert actual_unread == unread_count, \
            f"Unread count should be {unread_count}, got {actual_unread}"
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


class TestUnreadCountAccuracy:
    """
    **Feature: notification-system, Property 5: Unread count accuracy**
    
    For any set of notifications, the unread count should equal the number 
    of notifications where is_read === false.
    """

    @hypothesis_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @given(
        read_count=st.integers(min_value=0, max_value=20),
        unread_count=st.integers(min_value=0, max_value=20)
    )
    def test_unread_count_accuracy(self, read_count: int, unread_count: int):
        """
        **Feature: notification-system, Property 5: Unread count accuracy**
        **Validates: Requirements 3.3**
        
        Property: Unread count should accurately reflect the number of unread notifications.
        """
        asyncio.get_event_loop().run_until_complete(
            run_unread_count_accuracy_test(read_count, unread_count)
        )



from app.models.task_card import TaskCard


async def run_at_risk_notification_test(
    current_streak: int,
    checked_in_today: bool
) -> None:
    """
    Helper function to test at-risk notification generation.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    from datetime import date, timedelta
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    async with async_session_maker() as session:
        # Create a habit
        habit = TaskCard(
            id=str(uuid.uuid4()),
            title='Test Habit',
            content='',
            is_habit=True,
            is_deleted=False,
            current_streak=current_streak,
            longest_streak=current_streak,
            last_checkin_date=today if checked_in_today else yesterday
        )
        session.add(habit)
        await session.commit()
        
        # Generate at-risk notifications
        service = NotificationService(session)
        notifications = await service.generate_at_risk_notifications()
        
        # Check expectations
        should_generate = current_streak > 0 and not checked_in_today
        
        if should_generate:
            assert len(notifications) == 1, \
                f"Should generate 1 at-risk notification for streak={current_streak}, checked_in_today={checked_in_today}"
            assert notifications[0].data.get('at_risk') == True, \
                "Notification should have at_risk=True in data"
            assert notifications[0].data.get('habit_id') == habit.id, \
                "Notification should reference the correct habit"
        else:
            assert len(notifications) == 0, \
                f"Should not generate at-risk notification for streak={current_streak}, checked_in_today={checked_in_today}"
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


class TestAtRiskNotification:
    """
    **Feature: notification-system, Property 1: At-risk notification generation**
    
    For any habit with current_streak > 0 and last_checkin_date !== today, 
    the system should generate an at-risk notification for that habit.
    """

    @hypothesis_settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @given(
        current_streak=st.integers(min_value=0, max_value=100),
        checked_in_today=st.booleans()
    )
    def test_at_risk_notification_generation(self, current_streak: int, checked_in_today: bool):
        """
        **Feature: notification-system, Property 1: At-risk notification generation**
        **Validates: Requirements 1.2**
        
        Property: At-risk notifications should only be generated for habits with 
        active streaks that haven't been checked in today.
        """
        asyncio.get_event_loop().run_until_complete(
            run_at_risk_notification_test(current_streak, checked_in_today)
        )
