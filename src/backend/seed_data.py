"""
Seed script to populate the database with sample data for testing
"""

import sqlite3
import uuid
from datetime import datetime, timedelta
import random

# Database path
DB_PATH = "lifeflow.db"

def generate_uuid():
    return str(uuid.uuid4())

def seed_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    cursor.execute("DELETE FROM checkin_records")
    cursor.execute("DELETE FROM task_cards")
    cursor.execute("DELETE FROM card_lists")
    cursor.execute("DELETE FROM life_entries")
    
    now = datetime.now()
    today = now.date()
    
    # ========== Card Lists ==========
    lists = [
        (generate_uuid(), "工作", "#3B82F6", 0),
        (generate_uuid(), "学习", "#22C55E", 1),
        (generate_uuid(), "生活", "#F59E0B", 2),
    ]
    
    cursor.executemany(
        "INSERT INTO card_lists (id, name, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?)",
        [(l[0], l[1], l[2], l[3], now.isoformat()) for l in lists]
    )
    print(f"✓ 插入 {len(lists)} 个列表")
    
    # ========== Task Cards (Habits) ==========
    habits = [
        ("每日阅读", "阅读30分钟技术书籍或文章", lists[1][0], 15, 21),
        ("晨间锻炼", "早起做20分钟运动", lists[2][0], 8, 12),
        ("冥想", "每天冥想10分钟，保持内心平静", lists[2][0], 5, 7),
        ("写代码", "每天至少写1小时代码", lists[0][0], 22, 30),
        ("学英语", "背单词或听英语播客", lists[1][0], 10, 15),
    ]
    
    habit_ids = []
    habit_last_checkins = {}  # Store last checkin date for each habit
    
    for title, content, list_id, current_streak, longest_streak in habits:
        habit_id = generate_uuid()
        habit_ids.append(habit_id)
        
        # Some habits checked in today, some yesterday
        last_checkin = today if random.random() > 0.3 else today - timedelta(days=1)
        habit_last_checkins[habit_id] = last_checkin
        
        cursor.execute(
            """INSERT INTO task_cards 
               (id, title, content, list_id, is_habit, current_streak, longest_streak, 
                last_checkin_date, created_at, updated_at, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (habit_id, title, content, list_id, True, current_streak, longest_streak,
             last_checkin.isoformat(), now.isoformat(), now.isoformat(), False)
        )
    print(f"✓ 插入 {len(habits)} 个习惯任务")

    
    # ========== Task Cards (Regular Tasks) ==========
    tasks = [
        ("完成项目报告", "整理本周工作内容，撰写周报", lists[0][0]),
        ("准备会议材料", "准备下周一的团队会议PPT", lists[0][0]),
        ("学习 React 18", "学习 React 18 新特性和 Hooks", lists[1][0]),
        ("整理书架", "把书架上的书按类别整理", lists[2][0]),
        ("购买生活用品", "牙膏、洗发水、纸巾", lists[2][0]),
    ]
    
    for title, content, list_id in tasks:
        task_id = generate_uuid()
        cursor.execute(
            """INSERT INTO task_cards 
               (id, title, content, list_id, is_habit, current_streak, longest_streak,
                created_at, updated_at, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (task_id, title, content, list_id, False, 0, 0,
             now.isoformat(), now.isoformat(), False)
        )
    print(f"✓ 插入 {len(tasks)} 个普通任务")
    
    # ========== Checkin Records ==========
    # Generate check-in records for the past 60 days
    checkin_count = 0
    for habit_id in habit_ids:
        # Random number of check-ins in the past 60 days
        num_checkins = random.randint(20, 50)
        checkin_dates = set()
        
        # First, ensure we have a checkin record for the last_checkin_date
        last_checkin = habit_last_checkins[habit_id]
        checkin_dates.add(last_checkin)
        checkin_id = generate_uuid()
        checkin_time = datetime.combine(last_checkin, datetime.min.time()) + timedelta(hours=random.randint(6, 22))
        cursor.execute(
            """INSERT INTO checkin_records (id, task_id, checkin_date, checkin_time)
               VALUES (?, ?, ?, ?)""",
            (checkin_id, habit_id, last_checkin.isoformat(), checkin_time.isoformat())
        )
        checkin_count += 1
        
        # Then add random historical check-ins
        for _ in range(num_checkins - 1):
            days_ago = random.randint(1, 60)  # Start from 1 to avoid today if already added
            checkin_date = today - timedelta(days=days_ago)
            
            # Avoid duplicate dates for same habit
            if checkin_date not in checkin_dates:
                checkin_dates.add(checkin_date)
                checkin_id = generate_uuid()
                checkin_time = datetime.combine(checkin_date, datetime.min.time()) + timedelta(hours=random.randint(6, 22))
                
                cursor.execute(
                    """INSERT INTO checkin_records (id, task_id, checkin_date, checkin_time)
                       VALUES (?, ?, ?, ?)""",
                    (checkin_id, habit_id, checkin_date.isoformat(), checkin_time.isoformat())
                )
                checkin_count += 1
    
    print(f"✓ 插入 {checkin_count} 条打卡记录")
    
    # ========== Life Entries ==========
    life_entries = [
        ("今天完成了 LifeFlow 统计仪表盘的开发，感觉很有成就感！", 0),
        ("早起跑步5公里，天气很好，心情愉快。", 1),
        ("读完了《代码整洁之道》第三章，收获很多关于函数设计的知识。", 2),
        ("和朋友一起吃了火锅，聊了很多有趣的话题。", 3),
        ("学习了 ECharts 的使用，做了一个漂亮的热力图。", 4),
        ("今天工作效率很高，提前完成了本周的任务。", 5),
        ("尝试了新的冥想APP，感觉比之前的更好用。", 6),
        ("周末去了公园散步，拍了很多好看的照片。", 7),
        ("开始学习 TypeScript，类型系统确实能减少很多bug。", 8),
        ("今天做了一顿丰盛的晚餐，尝试了新菜谱。", 9),
        ("参加了线上技术分享会，学到了很多新东西。", 10),
        ("整理了房间，扔掉了很多不需要的东西，感觉清爽多了。", 11),
        ("和家人视频通话，聊了近况，很开心。", 12),
        ("完成了一个小项目的重构，代码质量提升了不少。", 13),
        ("今天天气不好，在家看了一部好电影。", 14),
    ]
    
    for content, days_ago in life_entries:
        entry_id = generate_uuid()
        entry_time = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        
        cursor.execute(
            """INSERT INTO life_entries (id, content, created_at, updated_at, is_deleted)
               VALUES (?, ?, ?, ?, ?)""",
            (entry_id, content, entry_time.isoformat(), entry_time.isoformat(), False)
        )
    print(f"✓ 插入 {len(life_entries)} 条生活记录")
    
    conn.commit()
    conn.close()
    print("\n✅ 数据库种子数据插入完成！")

if __name__ == "__main__":
    seed_database()
