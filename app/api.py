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
    file = BytesIO(await pdf.read())
    table = read_pdf(file)
    parser = allParser.get(parser_string)

    if parser is None:
        return HTMLResponse(content="Parser not found", status_code=400)

    cal = Calendar()
    courses = parser().table_to_courses(table)
    start_date, end_date = ntnu.Semester().get_date(semester)
    for course in courses:
        cal.add_component(course.to_ical_events(start_date, end_date))

    return Response(content=cal.to_ical(), media_type="text/calendar")
