def validate_number(number: int) -> int:
    number = int(number)
    if not 0 <= number <= 9:
        raise ValueError("Number must be between 0 and 9.")
    return number


def get_size(number: int) -> str:
    number = validate_number(number)
    return "Small" if number <= 4 else "Big"


def get_color(number: int) -> str:
    number = validate_number(number)
    # Common WinGo-style display mapping. Verify the rules of your provider.
    if number in (0, 5):
        return "Violet"
    if number in (1, 3, 7, 9):
        return "Green"
    return "Red"


def get_result_details(number: int) -> dict:
    number = validate_number(number)
    return {
        "number": number,
        "size": get_size(number),
        "color": get_color(number),
    }
