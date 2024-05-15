from io import BytesIO
from icalendar import Calendar
from fastapi import UploadFile, APIRouter
from fastapi.responses import HTMLResponse, Response
from .utils import read_pdf
from .parser.factory import ParserFactory, SemesterFactory


router = APIRouter()

parserFactory = ParserFactory()
semesterFactory = SemesterFactory()


@router.post("/pdftocalendar", response_class=Response)
async def pdf_to_calendar(pdf: UploadFile, school: str, pdfType: str, semester: str):
    # 開啟並讀取 PDF 檔
    file = BytesIO(await pdf.read())
    table = read_pdf(file)

    # 透過 parser_string 取得對應的 parser
    try:
        parser = parserFactory.get_parser(school, pdfType)
    except KeyError:
        return HTMLResponse(
            content="Parser not found (either school or pdfType is incorrect)",
            status_code=400,
        )

    # 建立 Calendar 物件
    cal = Calendar()

    # 將 table 轉換成 courses
    courses = parser.table_to_courses(table)

    # 取得學期開始與結束日期
    try:
        start_date, end_date = semesterFactory.get_semester(school).get_date(semester)
    except KeyError:
        return HTMLResponse(content="Semester not found (e.g. 112-2)", status_code=400)

    # 將每堂課程的事件加入 Calendar 物件
    for course in courses:
        cal.add_component(course.to_ical_events(start_date, end_date))

    return Response(content=cal.to_ical(), media_type="text/calendar")
