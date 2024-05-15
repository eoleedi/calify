from . import ntnu


class ParserFactory:
    def __init__(self):
        self.parsers = {
            "ntnu": {
                "SimpleTimeTable": ntnu.SimpleTimeTableParser(),
            }
        }

    def get_parser(self, school: str, pdfType: str):
        try:
            return self.parsers[school][pdfType]
        except KeyError as exc:
            raise KeyError("Parser not found") from exc


class SemesterFactory:
    def __init__(self):
        self.semesters = {
            "ntnu": ntnu.Semester(),
        }

    def get_semester(self, school: str):
        try:
            return self.semesters[school]
        except KeyError as exc:
            raise KeyError("Semester not found") from exc
