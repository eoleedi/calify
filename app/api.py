from io import BytesIO
from icalendar import Calendar
from fastapi import UploadFile, APIRouter
from fastapi.responses import HTMLResponse, Response
from .utils import read_pdf
from .parser import ntnu


allParser = {"ntnuSimpleTimeTableParser": ntnu.SimpleTimeTableParser}
router = APIRouter()


@router.post("/pdftocalendar", response_class=Response)
async def pdf_to_calendar(pdf: UploadFile, parser_string: str, semester: str):
    # 開啟並讀取 PDF 檔
    file = BytesIO(await pdf.read())
    table = read_pdf(file)

    # 透過 parser_string 取得對應的 parser
    parser = allParser.get(parser_string)
    if parser is None:
        return HTMLResponse(content="Parser not found", status_code=400)
    else:
        parser = parser()

    # 建立 Calendar 物件
    cal = Calendar()

    # 將 table 轉換成 courses
    courses = parser.table_to_courses(table)

    # 取得學期開始與結束日期
    try:
        start_date, end_date = ntnu.Semester().get_date(
            semester
        )  # TODO: Let user choose which school's semester
    except KeyError:
        return HTMLResponse(content="Semester not found", status_code=400)

    # 將每堂課程的事件加入 Calendar 物件
    for course in courses:
        cal.add_component(course.to_ical_events(start_date, end_date))

    return Response(content=cal.to_ical(), media_type="text/calendar")
