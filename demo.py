"""Demo script to show the API function."""

import asyncio
import aiofiles  # pip install aiofiles (to use the demo)
from app.api import pdf_to_calendar


async def main(input_path: str, output_path: str):
    """Main function to run the demo."""
    async with aiofiles.open(input_path, "rb") as f:
        response = await pdf_to_calendar(f, "tmuh", "FullTimeTable", "112-2")
        if response.status_code != 200:
            print(response.body.decode())
            return
        with open(output_path, "wb") as f:
            f.write(response.body)


if __name__ == "__main__":
    asyncio.run(main("testdata/北醫.pdf", "calendar.ics"))
