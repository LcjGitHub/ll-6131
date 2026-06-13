"""初始化示例数据。"""

from sqlalchemy.orm import Session

from models import Book, Marginalia

BOOK_SEED_DATA: list[dict[str, str | int | None]] = [
    {
        "title": "红楼梦",
        "author": "曹雪芹",
        "edition": "己卯本抄本影印",
        "volume_count": 4,
    },
    {
        "title": "聊斋志异",
        "author": "蒲松龄",
        "edition": "青柯亭刻本",
        "volume_count": 2,
    },
    {
        "title": "陶庵梦忆",
        "author": "张岱",
        "edition": "粤雅堂丛书本",
        "volume_count": 1,
    },
    {
        "title": "世说新语",
        "author": "刘义庆",
        "edition": "宋绍兴八年刻本",
        "volume_count": 3,
    },
    {
        "title": "论语注疏",
        "author": "何晏 注 / 邢昺 疏",
        "edition": "十三经注疏本",
        "volume_count": 2,
    },
]

MARGINALIA_SEED_DATA: list[dict[str, str | None]] = [
    {
        "book_title": "红楼梦",
        "page_number": "32",
        "original_text": "满纸荒唐言，一把辛酸泪。都云作者痴，谁解其中味？",
        "marginalia_content": "开篇即定调，非闲笔。己卯本与此异，当对照。",
        "purchase_channel": "孔夫子旧书网",
    },
    {
        "book_title": "红楼梦",
        "page_number": "117",
        "original_text": "好一似食尽鸟投林，落了片白茫茫大地真干净。",
        "marginalia_content": "脂批谓「干净」二字最妙，余以为然。",
        "purchase_channel": "孔夫子旧书网",
    },
    {
        "book_title": "聊斋志异",
        "page_number": "58",
        "original_text": "书痴故效书痴，柳泉以意为之耳。",
        "marginalia_content": "此条眉批疑为后人补，墨迹较新。",
        "purchase_channel": "线下古玩市场",
    },
    {
        "book_title": "陶庵梦忆",
        "page_number": "12",
        "original_text": "西湖之胜，晴湖不如雨湖，雨湖不如月湖。",
        "marginalia_content": "张岱笔意在此，眉批点破「月湖」为胜。",
        "purchase_channel": "友人赠阅",
    },
    {
        "book_title": "世说新语",
        "page_number": "76",
        "original_text": "谢公与人围棋，俄而谢玄淮上信至。看书竟，默然无言。",
        "marginalia_content": "谢安镇定，批者注「围棋」二字有深意。",
        "purchase_channel": "国家图书馆影印本",
    },
]


def seed_books(db: Session) -> None:
    """若表为空则写入 5 条示例书目。"""
    if db.query(Book).count() > 0:
        return

    for item in BOOK_SEED_DATA:
        db.add(Book(**item))

    db.commit()


def seed_marginalia(db: Session) -> None:
    """若表为空则写入 5 条示例摘录，通过书名匹配书目外键。"""
    if db.query(Marginalia).count() > 0:
        return

    book_map: dict[str, int] = {b.title: b.id for b in db.query(Book).all()}

    for item in MARGINALIA_SEED_DATA:
        book_title = item["book_title"]
        book_id = book_map.get(book_title)
        if book_id is None:
            continue
        db.add(
            Marginalia(
                book_id=book_id,
                book_title=book_title,
                page_number=item["page_number"],
                original_text=item["original_text"],
                marginalia_content=item["marginalia_content"],
                purchase_channel=item.get("purchase_channel"),
            )
        )

    db.commit()
