# 计划

### 测试1: A分支较为老, 别人在A分支之前向远程推送了B分支 修改的有相同文件 观察是否推送失败 或者 有冲突, 这里注意 A分支修改的是第1行, B分支修改的是第10行

**github的操作是:**  
收到一个pr后 就合并一个pr, 并没有分支处于pr状态

<br>

**流程:**  
1. 我要在 master分支 上创建 memo 文件

2. 基于 master分支 创建了 A分支 修改 memo 文件的 **第1行**
  - git checkout -b A
  - git add .
  - git commit -m "A modify row1"
  - git checkout master
    - 在没有push的情况下, 切换回master分支

3. 然后 我要在A分支后 创建B分支 修改 memo 文件的 **第10行**
  - git checkout -b B
  - git add .
  - git commit -m "B modify row10"
  - git push -u origin B
    - 推送到远程B分支

4. github的操作
  - 创建 B分支 合并到 master分支 的 pr
  - 将 B分支 合并到 master分支 上
  - 删除合并后的 远程B分支

5. 本地的操作
  - 切换回 A分支
  - git push -u origin A
    - 推送到远程A分支

6. github的操作
  - 创建 A分支 合并到 master分支 的 pr
  - 将 A分支 合并到 master分支 上
  - 删除合并后的 远程A分支

<br>

### 结论: 不会有冲突
虽然修改的是同一文件, 由于 B分支的修改**先被合并到master分支**, 而 **A分支在B分支合并之后才推送并创建PR**, 因此 **A分支不会与B分支产生冲突**

B分支先合并到 master分支 上 结果如下
```s
1. 第1行文本
2. 第2行文本
3. 第3行文本
4. 第4行文本
5. 第5行文本
6. 第6行文本
7. 第7行文本
8. 第8行文本
9. 第9行文本
10. 第10行文本: B分支修改了第10行
```

然后较为老的A分支再合并到 master分支 上 结果如下
```s
1. 第1行文本: A分支修改了第1行
2. 第2行文本
3. 第3行文本
4. 第4行文本
5. 第5行文本
6. 第6行文本
7. 第7行文本
8. 第8行文本
9. 第9行文本
10. 第10行文本: B分支修改了第10行
```

<br>

### 测试2: A分支较为老, 别人在A分支之前向远程推送了B分支 修改的有相同文件 观察是否推送失败 或者 有冲突, 这里注意 A分支修改的是第1行, B分支修改的是第1行

**github的操作是:**  
收到一个pr后 就合并一个pr, 并没有分支处于pr状态

<br>

**流程:**  
1. 我要在 master分支 上创建 memo 文件

2. 基于 master分支 创建了 A分支 修改 memo 文件的 **第1行**
  - git checkout -b A
  - git add .
  - git commit -m "A modify row1"
  - git checkout master
    - 在没有push的情况下, 切换回master分支

3. 然后 我要在A分支后 创建B分支 修改 memo 文件的 **第1行**
  - git checkout -b B
  - git add .
  - git commit -m "B modify row1"
  - git push -u origin B
    - 推送到远程B分支

4. github的操作
  - 创建 B分支 合并到 master分支 的 pr
  - 将 B分支 合并到 master分支 上
  - 删除合并后的 远程B分支

5. 本地的操作
  - 切换回 A分支
  - git push -u origin A
    - 推送到远程A分支

6. github的操作
  - 创建 A分支 合并到 master分支 的 pr
  - 将 A分支 合并到 master分支 上
  - 删除合并后的 远程A分支

<br>

### 测试文本:
1. 第1行文本: B分支修改了第1行
2. 第2行文本
3. 第3行文本
4. 第4行文本
5. 第5行文本
6. 第6行文本
7. 第7行文本
8. 第8行文本
9. 第9行文本
10. 第10行文本