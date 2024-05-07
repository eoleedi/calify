"""Demo script to show the API function."""

import asyncio
import aiofiles  # pip install aiofiles (to use the demo)
from app.api import pdf_to_calendar


async def main(input_path: str, output_path: str):
    """Main function to run the demo."""
    async with aiofiles.open(input_path, "rb") as f:
        response = await pdf_to_calendar(f, "ntnuSimpleTimeTableParser", "112-2")
        with open(output_path, "wb") as f:
            f.write(response.body)


if __name__ == "__main__":
    asyncio.run(main("timetable.pdf", "calendar.ics"))
