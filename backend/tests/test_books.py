"""书目集成测试：新增、删除无摘录书目、删除有摘录书目被拒绝。"""


class TestBookAPI:
    def test_create_book(self, client):
        response = client.post(
            "/api/books",
            json={
                "title": "红楼梦",
                "author": "曹雪芹",
                "edition": "人民文学出版社",
                "volume_count": 4,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] > 0
        assert data["title"] == "红楼梦"
        assert data["author"] == "曹雪芹"
        assert data["edition"] == "人民文学出版社"
        assert data["volume_count"] == 4
        assert data["marginalia_count"] == 0

    def test_delete_book_without_marginalia_success(self, client):
        create_resp = client.post(
            "/api/books",
            json={
                "title": "西游记",
                "author": "吴承恩",
                "edition": "中华书局",
                "volume_count": 3,
            },
        )
        assert create_resp.status_code == 201
        book_id = create_resp.json()["id"]

        list_resp = client.get("/api/books")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

        delete_resp = client.delete(f"/api/books/{book_id}")
        assert delete_resp.status_code == 204

        list_resp_after = client.get("/api/books")
        assert list_resp_after.status_code == 200
        assert len(list_resp_after.json()) == 0

    def test_delete_book_with_marginalia_rejected(self, client):
        book_resp = client.post(
            "/api/books",
            json={
                "title": "水浒传",
                "author": "施耐庵",
                "edition": "上海古籍出版社",
                "volume_count": 2,
            },
        )
        assert book_resp.status_code == 201
        book_id = book_resp.json()["id"]

        client.post(
            "/api/marginalia",
            json={
                "book_id": book_id,
                "page_number": "第 15 页",
                "original_text": "林冲雪夜上梁山",
                "marginalia_content": "此处描写极为精彩",
                "purchase_channel": "旧书摊",
                "is_favorite": True,
                "entry_date": "2024-03-10",
                "tag_ids": [],
            },
        )

        book_detail_resp = client.get(f"/api/books/{book_id}")
        assert book_detail_resp.status_code == 200
        assert book_detail_resp.json()["marginalia_count"] == 1

        delete_resp = client.delete(f"/api/books/{book_id}")
        assert delete_resp.status_code == 400
        error_data = delete_resp.json()
        assert "仍有 1 条摘录" in error_data["detail"]

        list_resp = client.get("/api/books")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

    def test_delete_nonexistent_book(self, client):
        response = client.delete("/api/books/9999")
        assert response.status_code == 404
