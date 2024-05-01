import csv
import pdfplumber

pdf = pdfplumber.open("timetable.pdf")  # 開啟 pdf
print(pdf.pages)
page = pdf.pages[0]  # 讀取第一頁
table = page.extract_table()  # 取出文字
print(table)

csvfile = open("test-csv.csv", "w+", encoding="utf-8")  # 建立 CSV 檔案
write = csv.writer(csvfile)  # 建立寫入物件
for i in table:
    write.writerow(i)  # 讀取表格每一列寫入 CSV
print("ok")
pdf.close()
