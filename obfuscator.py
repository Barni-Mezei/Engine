import re
import sys
import include_order

def obfuscate_js(file_path : str, separator : str = " ") -> str:
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
        js_code = js_code.replace(s, f'__STRING_PLACEHOLDER_{i}__')

    js_code = re.sub(r'^\s+', '', js_code, flags = re.MULTILINE) # Remove leading whitespace from each line
    js_code = re.sub(r'\}\s*\n', '};\n', js_code)  # Preserve line breaks after closing curly braces
    js_code = re.sub(r'\]\s*\n', '];\n', js_code)  # Preserve line breaks after closing square braces
    js_code = re.sub(r'(?<!["\'`])\n(?!["\'`])', separator, js_code)  # Remove line breaks outside of strings

    # Restore the original strings
    for i, s in enumerate(strings):
        js_code = js_code.replace(f'__STRING_PLACEHOLDER_{i}__', s)

    # File name indicator
    file_name_indicator = f"\n\n/* {file_path} */\n"

    #return file_name_indicator + js_code
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
"""

def main(output_file_path : str) -> None:
    new_line_separator = ""

    # The order matters!
    # files_to_be_obfuscated = [
    #     "src/resourceLoader.js",
    #     "src/resourceManager.js",
    #     "src/inputs.js",
    #     "src/math.js",
    #     "src/vector.js",
    #     "src/camera.js",
    #     "src/pid.js",
    #     "src/path.js",
    #     "src/grid.js",
    #     "src/main.js",
    # ]

    files_to_be_obfuscated = include_order.get_include_order("./src")
    files_to_be_obfuscated = [f"src/{f}.js" for f in files_to_be_obfuscated]

    file_out = open(output_file_path, "w", encoding = "utf-8")

    for i, path in enumerate(files_to_be_obfuscated):
        print(f"Obfuscating (\033[90m{(i+1):>02}/{len(files_to_be_obfuscated):>02}\033[0m): \033[36m{path:<40}\033[0m", end=" . . . ")
        try:
            file_out.write( obfuscate_js(path, new_line_separator) )
        except Exception as e:
            print(f"\033[31mFailed!\n\n\033[0m{e}")
            return

        print("\033[32mDone!\033[0m")

    file_out.close()

    print()
    print(f"Obfuscated {len(files_to_be_obfuscated)} files into: \033[36m{output_file_path}\033[0m")

if __name__ == "__main__":
    if len(sys.argv) == 2:
        main(sys.argv[1])
    else:
        print("\033[31mPlease specify a destination file!\033[0m")