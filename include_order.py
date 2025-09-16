import os
from collections import defaultdict, deque

DIR = "./src"
INCLUDE_PREFIX = "/src"

def read_dependencies(file_name):
    with open(os.path.join(DIR, file_name) + ".js", 'r') as file:
        file.readline()
        fileDependencies = file.readline().strip().split(":")

        fileDependencies = fileDependencies[1]
        fileDependencies = fileDependencies.split(",")

        fileDependencies = [d.strip() for d in fileDependencies]

    #if fileDependencies[0] == "None": return []
    return fileDependencies

def build_graph(files):
    graph = defaultdict(list)
    in_degree = {file: 0 for file in files}
    in_degree["None"] = 0

    for file in files:
        dependencies = read_dependencies(file)
        for dep in dependencies:
            graph[dep].append(file)
            in_degree[file] += 1

    # Add None as dependency
    for file in files:
        if graph[file] == []:
            graph["None"].append(file)
            in_degree["None"] += 1

    return graph, in_degree

def search_for_file(file, graph):
    out = []

    for f in graph:
        if file in graph[f]:
            out.append(f)

    return out

def get_include_order(director):
    # Specify the directory containing the files
    files = [f.split(".js")[0] for f in os.listdir(director) if os.path.isfile(os.path.join(director, f)) and "js" in f]

    graph, in_degree = build_graph(files)

    include_order = [*files]

    for _ in range(len(files)):
        for file in files:
            current_index = include_order.index(file)
            new_index = current_index

            for dep in graph[file]:
                dep_index = include_order.index(dep)
                if dep_index < current_index:
                    new_index = dep_index

            include_order.pop(current_index)
            include_order.insert(new_index, file)

    return include_order

def main():
    include_order = get_include_order(DIR)

    print("Correct include order:")
    for file in include_order:
        print(f"<script defer src=\"{INCLUDE_PREFIX}/{file}.js\"></script>")

if __name__ == "__main__":
    main()
