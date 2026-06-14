"""摘录集成测试：新增、按书名搜索、单条删除、批量删除。"""


def create_test_book(client, title="测试书名", author="测试作者"):
    response = client.post(
        "/api/books",
        json={"title": title, "author": author, "edition": "第一版", "volume_count": 1},
    )
    assert response.status_code == 201
    return response.json()


class TestMarginaliaIntegration:
    def test_create_marginalia(self, client):
        book = create_test_book(client, title="三国演义", author="罗贯中")
        book_id = book["id"]

        response = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 42 页",
                "original_text": "话说天下大势，分久必合，合久必分",
                "marginalia_content": "开篇即点明历史循环之理，意味深长",
                "purchase_channel": "孔夫子旧书网",
                "is_favorite": True,
                "entry_date": "2024-01-15",
                "tag_ids": [],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] > 0
        assert data["book_id"] == book_id
        assert data["book_title"] == "三国演义"
        assert data["page_number"] == "第 42 页"
        assert data["original_text"] == "话说天下大势，分久必合，合久必分"
        assert data["marginalia_content"] == "开篇即点明历史循环之理，意味深长"
        assert data["purchase_channel"] == "孔夫子旧书网"
        assert data["is_favorite"] is True
        assert data["entry_date"] == "2024-01-15"

    def test_search_by_book_title(self, client):
        book1 = create_test_book(client, title="红楼梦", author="曹雪芹")
        book2 = create_test_book(client, title="西游记", author="吴承恩")

        for i in range(2):
            client.post(
                "/api/marginalia",
                json={
                    "book_id": book1["id"],
                    "page_number": f"第 {i + 10} 页",
                    "original_text": f"红楼梦原文 {i + 1}",
                    "marginalia_content": f"红楼梦眉批 {i + 1}",
                    "is_favorite": False,
                    "entry_date": "2024-02-01",
                    "tag_ids": [],
                },
            )

        client.post(
            "/api/marginalia",
            json={
                "book_id": book2["id"],
                "page_number": "第 20 页",
                "original_text": "西游记原文",
                "marginalia_content": "西游记眉批",
                "is_favorite": False,
                "entry_date": "2024-02-02",
                "tag_ids": [],
            },
        )

        all_resp = client.get("/api/marginalia")
        assert all_resp.status_code == 200
        assert all_resp.json()["total"] == 3

        search_resp = client.get("/api/marginalia?book_title=红楼梦")
        assert search_resp.status_code == 200
        search_data = search_resp.json()
        assert search_data["total"] == 2
        assert len(search_data["items"]) == 2
        for item in search_data["items"]:
            assert item["book_title"] == "红楼梦"

        partial_resp = client.get("/api/marginalia?book_title=西游")
        assert partial_resp.status_code == 200
        partial_data = partial_resp.json()
        assert partial_data["total"] == 1
        assert partial_data["items"][0]["book_title"] == "西游记"

        no_match_resp = client.get("/api/marginalia?book_title=不存在的书名")
        assert no_match_resp.status_code == 200
        assert no_match_resp.json()["total"] == 0

    def test_delete_single_marginalia(self, client):
        book = create_test_book(client, title="儒林外史", author="吴敬梓")
        book_id = book["id"]

        create_resp = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 8 页",
                "original_text": "范进中举",
                "marginalia_content": "科举制度的悲剧写照",
                "is_favorite": False,
                "entry_date": "2024-03-01",
                "tag_ids": [],
            },
        )
        assert create_resp.status_code == 201
        item_id = create_resp.json()["id"]

        get_resp = client.get(f"/api/marginalia/{item_id}")
        assert get_resp.status_code == 200

        delete_resp = client.delete(f"/api/marginalia/{item_id}")
        assert delete_resp.status_code == 204

        get_after_delete = client.get(f"/api/marginalia/{item_id}")
        assert get_after_delete.status_code == 404

        list_resp = client.get("/api/marginalia")
        assert list_resp.status_code == 200
        assert list_resp.json()["total"] == 0

    def test_batch_delete_marginalia(self, client):
        book = create_test_book(client, title="聊斋志异", author="蒲松龄")
        book_id = book["id"]

        ids = []
        for i in range(4):
            resp = client.post(
                "/api/marginalia",
                json={
                    "book_id": book_id,
                    "page_number": f"第 {i + 1} 页",
                    "original_text": f"聊斋故事 {i + 1}",
                    "marginalia_content": f"狐鬼花妖的世界 {i + 1}",
                    "is_favorite": False,
                    "entry_date": "2024-04-01",
                    "tag_ids": [],
                },
            )
            ids.append(resp.json()["id"])

        all_resp = client.get("/api/marginalia")
        assert all_resp.status_code == 200
        assert all_resp.json()["total"] == 4

        batch_delete_resp = client.post(
            "/api/marginalia/batch-delete",
            json={"ids": ids[0:3]},
        )
        assert batch_delete_resp.status_code == 200
        assert batch_delete_resp.json()["deleted_count"] == 3

        after_delete_resp = client.get("/api/marginalia")
        after_data = after_delete_resp.json()
        assert after_data["total"] == 1
        assert after_data["items"][0]["id"] == ids[3]

        delete_remaining_resp = client.post(
            "/api/marginalia/batch-delete",
            json={"ids": [ids[3]]},
        )
        assert delete_remaining_resp.status_code == 200
        assert delete_remaining_resp.json()["deleted_count"] == 1

        final_resp = client.get("/api/marginalia")
        assert final_resp.json()["total"] == 0

    def test_batch_delete_empty_ids(self, client):
        response = client.post(
            "/api/marginalia/batch-delete",
            json={"ids": []},
        )
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 0

    def test_batch_delete_with_nonexistent_ids(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        valid_resp = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 1 页",
                "original_text": "测试原文",
                "marginalia_content": "测试眉批",
                "is_favorite": False,
                "entry_date": "2024-05-01",
                "tag_ids": [],
            },
        )
        valid_id = valid_resp.json()["id"]

        response = client.post(
            "/api/marginalia/batch-delete",
            json={"ids": [valid_id, 9999, 10000]},
        )
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 1
