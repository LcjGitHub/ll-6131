"""初始化示例数据。"""

from datetime import date

from sqlalchemy.orm import Session

from models import Book, Marginalia, Tag

TAG_SEED_DATA: list[str] = [
    "文学",
    "考证",
    "版本对比",
]

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

MARGINALIA_SEED_DATA: list[dict[str, str | None | list[str] | bool | date]] = [
    {
        "book_title": "红楼梦",
        "page_number": "32",
        "original_text": "满纸荒唐言，一把辛酸泪。都云作者痴，谁解其中味？",
        "marginalia_content": "开篇即定调，非闲笔。己卯本与此异，当对照。",
        "purchase_channel": "孔夫子旧书网",
        "tag_names": ["文学", "版本对比"],
        "is_favorite": True,
        "entry_date": date(2025, 3, 15),
    },
    {
        "book_title": "红楼梦",
        "page_number": "117",
        "original_text": "好一似食尽鸟投林，落了片白茫茫大地真干净。",
        "marginalia_content": "脂批谓「干净」二字最妙，余以为然。",
        "purchase_channel": "孔夫子旧书网",
        "tag_names": ["文学"],
        "is_favorite": False,
        "entry_date": date(2025, 3, 18),
    },
    {
        "book_title": "聊斋志异",
        "page_number": "58",
        "original_text": "书痴故效书痴，柳泉以意为之耳。",
        "marginalia_content": "此条眉批疑为后人补，墨迹较新。",
        "purchase_channel": "线下古玩市场",
        "tag_names": ["考证"],
        "is_favorite": True,
        "entry_date": date(2025, 4, 2),
    },
    {
        "book_title": "陶庵梦忆",
        "page_number": "12",
        "original_text": "西湖之胜，晴湖不如雨湖，雨湖不如月湖。",
        "marginalia_content": "张岱笔意在此，眉批点破「月湖」为胜。",
        "purchase_channel": "友人赠阅",
        "tag_names": ["文学"],
        "is_favorite": False,
        "entry_date": date(2025, 4, 20),
    },
    {
        "book_title": "世说新语",
        "page_number": "76",
        "original_text": "谢公与人围棋，俄而谢玄淮上信至。看书竟，默然无言。",
        "marginalia_content": "谢安镇定，批者注「围棋」二字有深意。",
        "purchase_channel": "国家图书馆影印本",
        "tag_names": ["文学", "考证"],
        "is_favorite": True,
        "entry_date": date(2025, 5, 8),
    },
    {
        "book_title": "论语注疏",
        "page_number": "卷一 3",
        "original_text": "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
        "marginalia_content": "「时习」非仅温书，实乃践履之义。眉批点出「学」与「习」之别。",
        "purchase_channel": "中华书局排印本",
        "tag_names": ["文学", "版本对比"],
        "is_favorite": False,
        "entry_date": date(2025, 5, 15),
    },
    {
        "book_title": "论语注疏",
        "page_number": "卷二 17",
        "original_text": "温故而知新，可以为师矣。",
        "marginalia_content": "此条有朱墨两批，朱批云「温故非徒记诵」，当是何晏注义。",
        "purchase_channel": "中华书局排印本",
        "tag_names": ["考证", "版本对比"],
        "is_favorite": True,
        "entry_date": date(2025, 5, 18),
    },
    {
        "book_title": "聊斋志异",
        "page_number": "卷二 34",
        "original_text": "一夕归，见二人与师共酌。日已暮，尚无灯烛。",
        "marginalia_content": "「崂山道士」开头，批者「幻术虽小，亦见人心」七字，颇有意。",
        "purchase_channel": "线下古玩市场",
        "tag_names": ["文学"],
        "is_favorite": False,
        "entry_date": date(2025, 5, 22),
    },
    {
        "book_title": "陶庵梦忆",
        "page_number": "卷三 47",
        "original_text": "湖心亭看雪：大雪三日，湖中人鸟声俱绝。",
        "marginalia_content": "「天与云与山与水」连用四「与」字，批者圈出，称其文气之妙。",
        "purchase_channel": "友人赠阅",
        "tag_names": ["文学", "考证"],
        "is_favorite": True,
        "entry_date": date(2025, 5, 30),
    },
    {
        "book_title": "红楼梦",
        "page_number": "卷三 42",
        "original_text": "座上珠玑昭日月，堂前黼黻焕烟霞。",
        "marginalia_content": "荣国府堂联，脂批「此联极妙，非世家不能有」，确论。",
        "purchase_channel": "孔夫子旧书网",
        "tag_names": ["版本对比"],
        "is_favorite": False,
        "entry_date": date(2025, 6, 5),
    },
    {
        "book_title": "世说新语",
        "page_number": "卷上 23",
        "original_text": "王子猷居山阴，夜大雪，眠觉，开室命酌酒，四望皎然。",
        "marginalia_content": "「乘兴而来，兴尽而返」，批者称其高人雅致，三复斯言。",
        "purchase_channel": "国家图书馆影印本",
        "tag_names": ["文学"],
        "is_favorite": False,
        "entry_date": date(2025, 6, 10),
    },
    {
        "book_title": "红楼梦",
        "page_number": "卷四 89",
        "original_text": "侬今葬花人笑痴，他年葬侬知是谁？",
        "marginalia_content": "黛玉葬花一诗，批者「泪尽而逝」四字，字字是矣。己卯本此处旁另有朱批「断肠句」。",
        "purchase_channel": "孔夫子旧书网",
        "tag_names": ["文学", "版本对比"],
        "is_favorite": True,
        "entry_date": date(2025, 6, 15),
    },
    {
        "book_title": "聊斋志异",
        "page_number": "卷三 72",
        "original_text": "忽闻有声如雷，女惊顾，俄见一物自空而下。",
        "marginalia_content": "「妖由人兴」四字批甚当。眉批引西宾之言，劝世深矣。",
        "purchase_channel": "线下古玩市场",
        "tag_names": ["考证"],
        "is_favorite": False,
        "entry_date": date(2025, 6, 20),
    },
    {
        "book_title": "论语注疏",
        "page_number": "卷四 29",
        "original_text": "见贤思齐焉，见不贤而内自省也。",
        "marginalia_content": "「思齐」与「自省」对举，邢疏谓「见贤思齐」非仅慕贤，实乃自修之要。墨批似是馆臣手笔。",
        "purchase_channel": "中华书局排印本",
        "tag_names": ["考证"],
        "is_favorite": True,
        "entry_date": date(2025, 6, 25),
    },
    {
        "book_title": "陶庵梦忆",
        "page_number": "卷五 103",
        "original_text": "余尝谓看月之道，与看画一也。",
        "marginalia_content": "张岱自谓「看月如看画」，眉批「会心处正在阿堵中」，批者亦是解人。",
        "purchase_channel": "友人赠阅",
        "tag_names": ["文学", "考证"],
        "is_favorite": False,
        "entry_date": date(2025, 6, 28),
    },
    {
        "book_title": "世说新语",
        "page_number": "卷下 142",
        "original_text": "嵇康临刑东市，神气不变，索琴弹之，奏广陵散。",
        "marginalia_content": "广陵散于今绝矣。批者双圈「神气不变」四字，称其雅量非常人可及。",
        "purchase_channel": "国家图书馆影印本",
        "tag_names": ["文学", "版本对比"],
        "is_favorite": True,
        "entry_date": date(2025, 7, 2),
    },
    {
        "book_title": "聊斋志异",
        "page_number": "卷四 95",
        "original_text": "俄见女郎自舍中出，年约十七八，貌颇纤秀，见生，惊避。",
        "marginalia_content": "「惊避」二字传神，批者云「女郎身分，在此二字」，是得文心者。",
        "purchase_channel": "线下古玩市场",
        "tag_names": ["文学"],
        "is_favorite": False,
        "entry_date": date(2025, 7, 8),
    },
    {
        "book_title": "红楼梦",
        "page_number": "卷五 112",
        "original_text": "滴不尽相思血泪抛红豆，开不完春柳春花满画楼。",
        "marginalia_content": "红豆词一曲，批者连圈密点，称其「句句是泪，字字是血」。己卯本此处旁有「泪尽」二字朱批。",
        "purchase_channel": "孔夫子旧书网",
        "tag_names": ["文学", "考证", "版本对比"],
        "is_favorite": True,
        "entry_date": date(2025, 7, 12),
    },
    {
        "book_title": "论语注疏",
        "page_number": "卷五 41",
        "original_text": "三人行，必有我师焉。择其善者而从之，其不善者而改之。",
        "marginalia_content": "邢疏谓「三人行」非定指三人，乃概言随处有师。眉批墨色凝重，疑是元人旧批，当细考。",
        "purchase_channel": "中华书局排印本",
        "tag_names": ["考证", "版本对比"],
        "is_favorite": False,
        "entry_date": date(2025, 7, 18),
    },
    {
        "book_title": "陶庵梦忆",
        "page_number": "卷七 156",
        "original_text": "虎丘中秋夜，士女云集，箫鼓喧阗，彻夜方散。",
        "marginalia_content": "张岱忆旧之作，满目苍凉。批者「盛极必衰」四字批于页侧，笔意沉郁，似有身世之感。",
        "purchase_channel": "友人赠阅",
        "tag_names": ["文学", "考证"],
        "is_favorite": True,
        "entry_date": date(2025, 7, 22),
    },
    {
        "book_title": "世说新语",
        "page_number": "卷中 67",
        "original_text": "王子猷尝暂寄人空宅住，便令种竹。或问：暂住何烦尔？",
        "marginalia_content": "「何可一日无此君」，徽之语也。批者旁书「名士风流」四字，叹羡不已。",
        "purchase_channel": "国家图书馆影印本",
        "tag_names": ["文学"],
        "is_favorite": False,
        "entry_date": date(2025, 7, 28),
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
    """写入示例摘录，通过书名+页码+录入日期判断是否已存在，不存在则补充。"""
    existing_keys = {
        (m.book_title, m.page_number, m.entry_date)
        for m in db.query(Marginalia).all()
    }

    book_map: dict[str, int] = {b.title: b.id for b in db.query(Book).all()}
    tag_map: dict[str, Tag] = {t.name: t for t in db.query(Tag).all()}

    for item in MARGINALIA_SEED_DATA:
        book_title = item["book_title"]
        page_number = item["page_number"]
        entry_date = item["entry_date"]
        key = (book_title, page_number, entry_date)
        if key in existing_keys:
            continue
        book_id = book_map.get(book_title)
        if book_id is None:
            continue
        tag_names = item.get("tag_names", []) or []
        tags = [tag_map[n] for n in tag_names if n in tag_map]
        db.add(
            Marginalia(
                book_id=book_id,
                book_title=book_title,
                page_number=page_number,
                original_text=item["original_text"],
                marginalia_content=item["marginalia_content"],
                purchase_channel=item.get("purchase_channel"),
                is_favorite=item.get("is_favorite", False),
                entry_date=entry_date,
                tags=tags,
            )
        )

    db.commit()


def seed_tags(db: Session) -> None:
    """若表为空则写入预置标签。"""
    if db.query(Tag).count() > 0:
        return

    for name in TAG_SEED_DATA:
        db.add(Tag(name=name))

    db.commit()
