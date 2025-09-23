import re
import sys
from argparse import ArgumentParser

import include_order

def obfuscate_js(file_path : str, verbose : bool = False) -> str:
    with open(file_path, 'r') as file:
        js_code = file.read()

    # Remove single-line comments (// ...)
    js_code = re.sub(r'//.*?(\n|$)', '\n', js_code)

    # Remove multi-line comments (/* ... */)
    js_code = re.sub(r'/\*.*?\*/', '', js_code, flags = re.DOTALL)

    # Preserve line breaks within string literals
    # This regex matches strings and template literals, capturing their content
    string_pattern = r'(["\'`].*?["\'`])'
    strings = re.findall(string_pattern, js_code, flags = re.DOTALL)

    # Replace strings with placeholders
    for i, s in enumerate(strings):
        js_code = js_code.replace(s, f"__STRING_PLACEHOLDER_{i}__")

    js_code = re.sub(r'^\s+', '', js_code, flags = re.MULTILINE) # Remove leading whitespace from each line
    js_code = re.sub(r'\}\s*\n', '};\n', js_code)  # Preserve line breaks after closing curly braces
    js_code = re.sub(r'\]\s*\n', '];\n', js_code)  # Preserve line breaks after closing square braces
    js_code = re.sub(r'(?<!["\'`])\n(?!["\'`])', "", js_code)  # Remove line breaks outside of strings
    js_code = re.sub(r'((?<=[^a-zA-Z_#]) (?=[^a-zA-Z_#]))|((?<=[^a-zA-Z_#]) (?=[a-zA-Z_#]))|((?<=[a-zA-Z_#]) (?=[^a-zA-Z_#]))', "", js_code)  # Remove unnescesseary spaces

    # Restore the original strings
    for i, s in enumerate(strings):
        js_code = js_code.replace(f"__STRING_PLACEHOLDER_{i}__", s)

    if verbose:
        # File content separator
        content_separator = f"\n\n/* {file_path} */\n"

        return content_separator + js_code
    else:
        return js_code



"""
Correct javascript syntax:
- Every line ending MUST have a semicolon;
- Arrays and objects: [
    a,
    b,
    c, <- the last line MUST have a colon.
]; <- this semicolon, will be added in this script, automatically

if (true) {
    console.log("");
}; <- so is this one.

TODO: Remove spaces if one of the neighbouring chars are {[(,;)]}
like function () {} to function(){}

"""

def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("filename", help="The output file name")
    parser.add_argument("-v", "--verbose", action="store_true")

    args = parser.parse_args()

    files_to_be_obfuscated = include_order.get_include_order("./src")
    files_to_be_obfuscated = [f"src/{f}.js" for f in files_to_be_obfuscated]

    file_out = open(args.filename, "w", encoding = "utf-8")

    for i, path in enumerate(files_to_be_obfuscated):
        print(f"Obfuscating (\033[90m{(i+1):>02}/{len(files_to_be_obfuscated):>02}\033[0m): \033[36m{path:<40}\033[0m", end=" . . . ")
        try:
            file_out.write( obfuscate_js(path, args.verbose) )
        except Exception as e:
            print(f"\033[31mFailed!\n\n\033[0m{e}")
            return

        print("\033[32mDone!\033[0m")

    file_out.close()

    print()
    print(f"Obfuscated {len(files_to_be_obfuscated)} files into: \033[36m{args.filename}\033[0m")


if __name__ == "__main__":
    main()