from .main import app
from .util import read_pdf
from fastAPI import UploadFile
from .parser import ntnu

allParser = {"ntnuSimpleTimeTableParser": ntnu.SimpleTimeTableParser}

@app.post("/pdftocalendar")
def pdf_to_calendar(pdf: UploadFile, parserString: str):
    if parser not in allParser:
        return False
    
    table = read_pdf(pdf)
    parser = allParser.get(parserString)

    if parser == "":
        return "Unspecified Parser"
    
    courses = parser.table_to_courses(table)
    # TODO: Make courses to calendar object
    # TODO return a http response
    return True
    



    