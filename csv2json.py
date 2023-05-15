# 将csv表格转化为JSON的小工具。

f = open("bmslist.csv", "r", encoding="utf-8")
flist = f.readlines()
f.close()


def split_line(line_str):
    cl = line_str.split(",")
    cl[-1] = cl[-1][:-1]
    return cl


table_head = split_line(flist[0])
tot_str = "["
for i in range(len(flist) - 1):
    str = "{"
    content = split_line(flist[i + 1])
    for j in range(len(table_head)):
        str += '"' + table_head[j] + '":"' + content[j] + '",'
    tot_str += str[:-1] + "},"
tot_str = tot_str[:-1] + "]"

f = open("bmstable.json", "w", encoding="utf-8")
f.write(tot_str)
f.close()
