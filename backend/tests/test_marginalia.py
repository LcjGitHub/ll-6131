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


class TestMarginaliaImport:
    def test_import_csv_success(self, client):
        csv_content = (
            "书名,页码,原文,眉批内容,购入渠道\n"
            "测试书名1,第 1 页,原文内容1,眉批内容1,孔夫子旧书网\n"
            "测试书名2,第 2 页,原文内容2,眉批内容2,淘宝旧书\n"
        )
        files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 2
        assert data["duplicate_count"] == 0
        assert data["error_count"] == 0
        assert len(data["errors"]) == 0

        list_resp = client.get("/api/marginalia")
        assert list_resp.json()["total"] == 2

    def test_import_csv_with_duplicates(self, client):
        csv_content = (
            "书名,页码,原文,眉批内容,购入渠道\n"
            "测试书名,第 1 页,重复原文,眉批内容1,孔夫子\n"
            "测试书名,第 1 页,重复原文,眉批内容2,孔夫子\n"
        )
        files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 1
        assert data["duplicate_count"] == 1
        assert data["error_count"] == 0

    def test_import_csv_with_errors(self, client):
        csv_content = (
            "书名,页码,原文,眉批内容,购入渠道\n"
            ",第 1 页,原文,眉批,渠道\n"
            "书名,,原文,眉批,渠道\n"
            "书名,第 1 页,,眉批,渠道\n"
            "书名,第 1 页,原文,,渠道\n"
        )
        files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 0
        assert data["duplicate_count"] == 0
        assert data["error_count"] == 4
        assert len(data["errors"]) == 4

    def test_import_csv_with_optional_fields(self, client):
        csv_content = (
            "书名,页码,原文,眉批内容,购入渠道,是否收藏,录入日期\n"
            "测试书名,第 1 页,原文内容,眉批内容,渠道,是,2024-01-15\n"
        )
        files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 1
        assert data["error_count"] == 0

        list_resp = client.get("/api/marginalia")
        items = list_resp.json()["items"]
        assert len(items) == 1
        assert items[0]["is_favorite"] is True
        assert items[0]["entry_date"] == "2024-01-15"

    def test_import_invalid_file_type(self, client):
        content = "not a csv content"
        files = {"file": ("test.txt", content.encode("utf-8"), "text/plain")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 400

    def test_import_empty_file(self, client):
        files = {"file": ("test.csv", b"", "text/csv")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 0
        assert data["error_count"] == 1

    def test_import_invalid_header(self, client):
        csv_content = "错误,表头,格式\n"
        files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 0
        assert data["error_count"] == 1

    def test_import_auto_create_book(self, client):
        csv_content = (
            "书名,页码,原文,眉批内容,购入渠道\n"
            "新书名,第 1 页,原文内容,眉批内容,渠道\n"
        )
        files = {"file": ("test.csv", csv_content.encode("utf-8"), "text/csv")}
        response = client.post("/api/marginalia/import", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["success_count"] == 1

        books_resp = client.get("/api/books")
        books = books_resp.json()
        assert any(book["title"] == "新书名" for book in books)
