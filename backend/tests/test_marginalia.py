from datetime import date


def create_test_book(client, title="测试书名", author="测试作者"):
    response = client.post(
        "/api/books",
        json={"title": title, "author": author, "edition": "第一版", "volume_count": 1},
    )
    assert response.status_code == 201
    return response.json()


class TestMarginaliaAPI:
    def test_list_empty(self, client):
        response = client.get("/api/marginalia")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["items"]) == 0

    def test_create_marginalia(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        response = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 10 页",
                "original_text": "测试原文内容",
                "marginalia_content": "测试眉批内容",
                "purchase_channel": "孔夫子旧书网",
                "is_favorite": False,
                "entry_date": "2024-01-01",
                "tag_ids": [],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["book_id"] == book_id
        assert data["page_number"] == "第 10 页"
        assert data["original_text"] == "测试原文内容"
        assert data["marginalia_content"] == "测试眉批内容"
        assert data["is_favorite"] is False

    def test_get_marginalia(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        create_resp = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 5 页",
                "original_text": "测试原文",
                "marginalia_content": "测试眉批",
                "purchase_channel": None,
                "is_favorite": True,
                "entry_date": "2024-02-15",
                "tag_ids": [],
            },
        )
        item_id = create_resp.json()["id"]

        response = client.get(f"/api/marginalia/{item_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == item_id
        assert data["is_favorite"] is True

    def test_get_nonexistent_marginalia(self, client):
        response = client.get("/api/marginalia/9999")
        assert response.status_code == 404

    def test_update_marginalia(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        create_resp = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 1 页",
                "original_text": "原始文本",
                "marginalia_content": "原始眉批",
                "purchase_channel": None,
                "is_favorite": False,
                "entry_date": "2024-01-01",
                "tag_ids": [],
            },
        )
        item_id = create_resp.json()["id"]

        response = client.put(
            f"/api/marginalia/{item_id}",
            json={
                "book_id": book_id,
                "page_number": "第 2 页",
                "original_text": "更新后的文本",
                "marginalia_content": "更新后的眉批",
                "purchase_channel": "当当网",
                "is_favorite": True,
                "entry_date": "2024-03-01",
                "tag_ids": [],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page_number"] == "第 2 页"
        assert data["original_text"] == "更新后的文本"
        assert data["purchase_channel"] == "当当网"
        assert data["is_favorite"] is True

    def test_delete_marginalia(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        create_resp = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 3 页",
                "original_text": "待删除文本",
                "marginalia_content": "待删除眉批",
                "purchase_channel": None,
                "is_favorite": False,
                "entry_date": "2024-01-01",
                "tag_ids": [],
            },
        )
        item_id = create_resp.json()["id"]

        response = client.delete(f"/api/marginalia/{item_id}")
        assert response.status_code == 204

        get_resp = client.get(f"/api/marginalia/{item_id}")
        assert get_resp.status_code == 404

    def test_delete_nonexistent_marginalia(self, client):
        response = client.delete("/api/marginalia/9999")
        assert response.status_code == 404

    def test_list_with_pagination(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        for i in range(5):
            client.post(
                "/api/marginalia",
                json={
                    "book_id": book_id,
                    "page_number": f"第 {i + 1} 页",
                    "original_text": f"原文 {i + 1}",
                    "marginalia_content": f"眉批 {i + 1}",
                    "purchase_channel": None,
                    "is_favorite": False,
                    "entry_date": "2024-01-01",
                    "tag_ids": [],
                },
            )

        response = client.get("/api/marginalia?page=1&page_size=2")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["items"]) == 2

    def test_toggle_favorite(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        create_resp = client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 1 页",
                "original_text": "测试原文",
                "marginalia_content": "测试眉批",
                "purchase_channel": None,
                "is_favorite": False,
                "entry_date": "2024-01-01",
                "tag_ids": [],
            },
        )
        item_id = create_resp.json()["id"]

        response = client.patch(
            f"/api/marginalia/{item_id}/favorite",
            json={"is_favorite": True},
        )
        assert response.status_code == 200
        assert response.json()["is_favorite"] is True

    def test_batch_delete(self, client):
        book = create_test_book(client)
        book_id = book["id"]

        ids = []
        for i in range(3):
            resp = client.post(
                "/api/marginalia",
                json={
                    "book_id": book_id,
                    "page_number": f"第 {i + 1} 页",
                    "original_text": f"原文 {i + 1}",
                    "marginalia_content": f"眉批 {i + 1}",
                    "purchase_channel": None,
                    "is_favorite": False,
                    "entry_date": "2024-01-01",
                    "tag_ids": [],
                },
            )
            ids.append(resp.json()["id"])

        response = client.post("/api/marginalia/batch-delete", json={"ids": ids})
        assert response.status_code == 200
        assert response.json()["deleted_count"] == 3

        list_resp = client.get("/api/marginalia")
        assert list_resp.json()["total"] == 0
