from typing import List
from fastapi import File
import pdfplumber


def read_pdf(file: File) -> List[List[str | None]] | None:
    pdf = pdfplumber.open(file)  # 開啟 pdf
    page = pdf.pages[0]  # 讀取第一頁
    return page.extract_table()  # 取出文字
