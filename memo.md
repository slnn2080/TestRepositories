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
    - 推送到远程A分支 **(推送成功)**

6. github的操作
  - 创建 A分支 合并到 master分支 的 pr
  - 将 A分支 合并到 master分支 上 **(无冲突)**
  - 删除合并后的 远程A分支

<br>

### 结论: 不会有冲突
虽然修改的是同一文件, 但是 两个分支修改的并不是同一行 所以不会产生冲突

不是因为 B分支的修改先被合并到master分支, 而 A分支在B分支合并之后才推送并创建PR, 所以 A分支不会与B分支产生冲突, **跟分支创建的先后顺序并没有关系**

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
    - 推送到远程A分支 **(推送成功)**

6. github的操作
  - 创建 A分支 合并到 master分支 的 pr
  - 将 A分支 合并到 master分支 上 **(有冲突, 并且需要在github端解决)**
  - 删除合并后的 远程A分支

<br>

### 根据 测试1 和 测试2 的总结出产生冲突的原因:
1. 是否会产生冲突 跟创建pr的先后顺序 没有关系
2. 是否会产生冲突 跟github端是否是先合并一个pr, 再合并另一个pr, 保持始终无等待状态的pr 没有关系
3. 是否会产生冲突 跟是否修改了**同一文件的同一位置有关系**
4. 是否会产生冲突 跟是否修改了 **同一文件的相邻行有关系**, 比如A分支修改了第一行, B分支修改了第二行 **也会产生冲突**
  - 如果修改了同一文件的非相邻行 **不会产生冲突**

<br>

### Git 冲突的原因不仅仅是修改的行号是否相同, 还涉及到 上下文的变化
**1. 相邻行的上下文冲突**
即使 A 分支和 B 分支修改的行不同, Git 还是可能因为它们修改的行非常接近或者相邻, 导致上下文的变化使得合并时发生冲突

如果 A 分支修改了的第1行影响到了第2行的上下文（比如加入了换行符或删除了某些字符）, 那么当 B 分支试图修改第2行时, Git 可能无法自动处理这种上下文的变化, 导致冲突。

<br>

**2. 不同的合并策略**  
如果你先合并了 A 分支, 然后再合并 B 分支, Git 会尝试自动合并 B 分支, 但由于 A 分支已经修改了文件并被合并到 master 上, **Git 会重新计算整个文件的差异**

如果 B 分支的修改与 A 分支的修改有关系（即便是不同的行）, Git 可能会根据合并策略认为这些改动不可自动处理, 从而提示冲突。

<br>

### 根据 测试1 和 测试2 的解决方式: 在push前 先下拉远程的 master分支 代码到当前分支
1. 我要在 master分支 上创建 memo 文件

2. 基于 master分支 创建了 A分支 修改 memo 文件的 **第1行**
  - git checkout -b A
  - git add .
  - git commit -m "A modify row1"
  - git push origin A

3. 然后 我要在A分支后 创建B分支 修改 memo 文件的 **第1行**
  - git checkout -b B
  - git add .
  - git commit -m "B modify row10"
  - git push -u origin B

4. github的操作
  - 创建 B分支 合并到 master分支 的 pr
  - 将 B分支 合并到 master分支 上 **(优先合并了B分支)**
  - 删除合并后的 远程B分支

5. 本地的操作
  - 切换回 A分支
  - 创建新文件 test
  - 拉取远程最新代码到本地, 以防在github的冲突 ``git pull origin master``
  - 报错

<br>

我们在下拉 ``origin/master`` 代码的时候, 如果 本地分支 和 远程的master分支 有 **分歧/分叉** 的话 **会出现下面的错误**

**解释: 什么叫做分叉?**  
A 分支和 master 分支之间发生了 分叉, 即它们的提交历史发生了分歧

A 分支在本地进行了修改, 而 B 分支已经先在远程 master 中合并, 这意味着 master 分支已经包含了 B 分支的更改, 但是 A 分支仍然基于一个较旧的 master 分支, 所以它与远程 master 分支有不同的提交历史。

你的本地 A 分支和远程的 master 分支由于不同的提交历史（B 分支已合并到 master, 而 A 分支没有同步）发生了分叉。Git 无法自动合并它们, 因为它不知道如何处理这种分叉, 特别是 A 分支和 master 之间的冲突。你需要手动合并这两个分支并解决冲突

<br>

**出现的错误:**  
```s
git pull origin master
  
remote: Enumerating objects: 1, done.
remote: Counting objects: 100% (1/1), done.
remote: Total 1 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
Unpacking objects: 100% (1/1), 889 bytes | 889.00 KiB/s, done.
From github.com:slnn2080/TestRepositories
* branch            master     -> FETCH_HEAD
  47ed0ac..2266d45  master     -> origin/master
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint: 
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
hint: 
hint: You can replace "git config" with "git config --global" to set a default
hint: preference for all repositories. You can also pass --rebase, --no-rebase,
hint: or --ff-only on the command line to override the configured default per
hint: invocation.
fatal: Need to specify how to reconcile divergent branches.
```

这个错误提示表明你在尝试执行 git pull 时, Git 发现你本地的分支和远程的 master 分支有 分叉（divergent）, 即它们各自有不同的提交, 导致 Git 无法自动合并它们

由于 B分支 已经合并到远程的 master 分支, 而本地的 A分支 还没有合并到远程的 master, 因此 分支发生了分叉, Git 无法自动决定如何将这两个分支合并

<br>

**解决方式:**  
需要告诉 Git 如何处理这种分叉的情况, 具体有两种方式

<br>

**1. 合并（merge）**   
如果你想将远程的 master 分支的修改合并到你的本地 A 分支, 使用合并的方式来解决分叉
```s
git config pull.rebase false  # 禁用rebase, 使用merge
git pull origin master        # 拉取并合并
```

这样, Git 会执行一次 合并操作, 将远程的 master 分支的提交合并到你的本地 A 分支。如果有冲突, Git 会提示你手动解决冲突。

<br>

**2. 变基（rebase）**  
如果你想让本地的提交放到远程 master 分支的最新提交之后（即重写历史）, 你可以选择 变基 操作。变基操作会将本地的提交 "重新播放" 到远程 master 分支的提交之后。

```s
git config pull.rebase true   # 启用rebase
git pull origin master        # 执行rebase
```

这会将本地的 A 分支提交的修改应用到远程 master 分支的最新状态上。如果有冲突, Git 会提示你解决冲突, 并在解决冲突后继续变基。

<br>

**3. 只允许快进合并（fast-forward only）**  
如果在 feature 分支上工作后, master 分支没有任何新的提交（**也就是说, master 分支与 feature 分支没有任何分歧**）, 我们希望只有在这种状态下才可以合并, 可以使用以下命令：
```s
git config pull.ff only        # 仅允许快进合并
git pull origin master         # 拉取远程 master 分支
```

<br>

**3种策略 哪种好?**  
推荐使用 merge

因为变基会重写历史, 在多人协作时可能带来问题

<br>

**上面的3种方式 会修改配置文件 影响到当前的仓库 如何避免:**  
- 如果想使用 meger策略: ``git pull --no-rebase origin master``
- 如果想使用 rebase策略: ``git pull --rebase origin master``

<br>

**解决冲突后 如何处理:**  
- 如果是 **meger** 策略
  - git add .
  - git commit -m ""
  - git push origin B

- 如果是 **rebase** 策略
  - git add .
  - git rebase --continue
  - git push --force-with-lease / git push --force
  ```s
  # 最后, 由于你进行了 rebase 操作, Git 的提交历史被修改, 所以你需要强制推送（--force 或 --force-with-lease）到远程分支
  --force-with-lease 比 --force 更安全, 它可以确保推送时远程分支没有被其他人修改过
  ```

<br>

**如果你不小心启用了 git config pull.ff only 并希望将配置还原到最初的状态 操作如下:**  
1. 恢复 Git 配置为默认行为
```s
# 如果你只想取消 pull.ff 配置，可以使用以下命令
git config --unset pull.ff
```

2. 确保正确配置
```s
# 如果输出为空，则表示 pull.ff 配置已被成功删除，Git 会恢复到默认行为（允许非快进合并）
git config --get pull.ff
```

3. 扩展: 查看全局和局部配置
```s
git config --global --get pull.ff
git config --get pull.ff
```

<br>

### 测试文本:
1. 第1行文本
2. 第2行文本
3. 第3行文本
4. 第4行文本
5. 第5行文本
6. 第6行文本
7. 第7行文本
8. 第8行文本
9. 第9行文本
10. 第10行文本