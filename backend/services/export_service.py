import csv
import io

from openpyxl import Workbook


def build_csv(rows: list[dict], headers: list[str]) -> bytes:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")

def build_xlsx(rows: list[dict], headers: list[str]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    assert sheet is not None
    sheet.append(headers)
    for row in rows:
        sheet.append([row.get(header, "") for header in headers])

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()