import csv
import io

from openpyxl import Workbook


def _sanitize_cell(val: object) -> object:
    if isinstance(val, str) and val.startswith(("=", "+", "-", "@")):
        return f"'{val}"
    return val


def build_csv(rows: list[dict], headers: list[str]) -> bytes:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    sanitized_rows = [{k: _sanitize_cell(v) for k, v in row.items()} for row in rows]
    writer.writerows(sanitized_rows)
    return buffer.getvalue().encode("utf-8")


def build_xlsx(rows: list[dict], headers: list[str]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    assert sheet is not None
    sheet.append(headers)
    for row in rows:
        sheet.append([_sanitize_cell(row.get(header, "")) for header in headers])

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()