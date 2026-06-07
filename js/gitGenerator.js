/* gitGenerator.js - Interactive Git Command Generator Logic */

export function initGitGeneratorTool() {
  const selectCategory = document.getElementById('git-action-category');
  const optionsContainer = document.getElementById('git-options-container');
  const textareaOutput = document.getElementById('git-output-code');
  const btnCopy = document.getElementById('git-copy-btn');
  const elAlert = document.getElementById('git-alert');

  if (!selectCategory || !optionsContainer || !textareaOutput) return;

  // Options Definitions
  const optionsTemplates = {
    'undo-commit': `
      <div class="form-group">
        <label class="form-label" id="lbl-git-undo-opt">Undo Method</label>
        <select class="form-control" id="git-undo-select">
          <option value="soft">Soft Reset: Keep changes in staging (保留修改，仅撤销提交) -> reset --soft</option>
          <option value="hard">Hard Reset: Discard all changes (彻底删除提交与修改) -> reset --hard</option>
          <option value="amend">Amend: Change last commit message (修改最后一次提交信息) -> commit --amend</option>
          <option value="revert">Revert: Safe revert a past commit (安全撤销历史提交) -> revert</option>
        </select>
      </div>
      <div class="form-group" id="git-undo-input-group" style="display:none;">
        <label class="form-label" id="lbl-git-undo-input-label">Details</label>
        <input type="text" class="form-control" id="git-undo-input" value="">
      </div>
    `,
    'discard-changes': `
      <div class="form-group">
        <label class="form-label" id="lbl-git-discard-opt">Discard Scope</label>
        <select class="form-control" id="git-discard-select">
          <option value="all">All local untracked and modified changes (丢弃所有本地未提交的修改)</option>
          <option value="file">A specific file/folder only (仅丢弃某个文件/文件夹的修改)</option>
        </select>
      </div>
      <div class="form-group" id="git-discard-input-group" style="display:none;">
        <label class="form-label" id="lbl-git-discard-path">Target Path</label>
        <input type="text" class="form-control" id="git-discard-input" value="src/index.js" placeholder="e.g. path/to/file.js">
      </div>
    `,
    'branches': `
      <div class="form-group">
        <label class="form-label" id="lbl-git-branch-opt">Branch Action</label>
        <select class="form-control" id="git-branch-select">
          <option value="create">Create & switch to new branch (新建并切换到新分支)</option>
          <option value="rename">Rename current branch (重命名当前本地分支)</option>
          <option value="delete">Delete local branch (删除本地分支)</option>
          <option value="merge">Merge another branch into current (合并分支)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" id="lbl-git-branch-name">Branch Name</label>
        <input type="text" class="form-control" id="git-branch-input" value="feature-branch">
      </div>
    `,
    'stash': `
      <div class="form-group">
        <label class="form-label" id="lbl-git-stash-opt">Stash Action</label>
        <select class="form-control" id="git-stash-select">
          <option value="save">Stash changes with optional message (保存当前工作区到暂存区)</option>
          <option value="apply">Apply latest stash (应用最近一次暂存，保留暂存记录)</option>
          <option value="pop">Pop latest stash (应用最近一次暂存，并删除暂存记录)</option>
          <option value="list">List all stashes (列出所有暂存记录)</option>
        </select>
      </div>
      <div class="form-group" id="git-stash-input-group">
        <label class="form-label" id="lbl-git-stash-msg">Stash Message Description</label>
        <input type="text" class="form-control" id="git-stash-input" value="work in progress" placeholder="e.g. fixing layout bug">
      </div>
    `
  };

  function updateOptions() {
    const category = selectCategory.value;
    optionsContainer.innerHTML = optionsTemplates[category] || '';
    
    // Bind specific sub-change listeners
    if (category === 'undo-commit') {
      const undoSelect = document.getElementById('git-undo-select');
      const inputGroup = document.getElementById('git-undo-input-group');
      const inputLabel = document.getElementById('lbl-git-undo-input-label');
      const inputField = document.getElementById('git-undo-input');

      undoSelect.addEventListener('change', () => {
        const val = undoSelect.value;
        if (val === 'amend') {
          inputGroup.style.display = 'block';
          inputLabel.textContent = 'New Commit Message (新提交注释)';
          inputField.value = 'docs: update readme text';
        } else if (val === 'revert') {
          inputGroup.style.display = 'block';
          inputLabel.textContent = 'Commit Hash to Revert (要撤销的提交哈希)';
          inputField.value = 'a1b2c3d4';
        } else {
          inputGroup.style.display = 'none';
        }
        generateCommand();
      });
      inputField.addEventListener('input', generateCommand);
    } else if (category === 'discard-changes') {
      const discardSelect = document.getElementById('git-discard-select');
      const inputGroup = document.getElementById('git-discard-input-group');
      const inputField = document.getElementById('git-discard-input');

      discardSelect.addEventListener('change', () => {
        if (discardSelect.value === 'file') {
          inputGroup.style.display = 'block';
        } else {
          inputGroup.style.display = 'none';
        }
        generateCommand();
      });
      inputField.addEventListener('input', generateCommand);
    } else if (category === 'branches') {
      const inputField = document.getElementById('git-branch-input');
      inputField.addEventListener('input', generateCommand);
      document.getElementById('git-branch-select').addEventListener('change', generateCommand);
    } else if (category === 'stash') {
      const stashSelect = document.getElementById('git-stash-select');
      const inputGroup = document.getElementById('git-stash-input-group');
      const inputField = document.getElementById('git-stash-input');

      stashSelect.addEventListener('change', () => {
        if (stashSelect.value === 'save') {
          inputGroup.style.display = 'block';
        } else {
          inputGroup.style.display = 'none';
        }
        generateCommand();
      });
      inputField.addEventListener('input', generateCommand);
    }

    generateCommand();
  }

  function generateCommand() {
    const category = selectCategory.value;
    let command = '';

    if (category === 'undo-commit') {
      const subVal = document.getElementById('git-undo-select').value;
      const inputVal = document.getElementById('git-undo-input').value;
      if (subVal === 'soft') {
        command = 'git reset --soft HEAD~1';
      } else if (subVal === 'hard') {
        command = 'git reset --hard HEAD~1';
      } else if (subVal === 'amend') {
        command = `git commit --amend -m "${inputVal.replace(/"/g, '\\"')}"`;
      } else if (subVal === 'revert') {
        command = `git revert ${inputVal || '[commit-hash]'}`;
      }
    } else if (category === 'discard-changes') {
      const subVal = document.getElementById('git-discard-select').value;
      if (subVal === 'all') {
        command = 'git checkout . && git clean -fd';
      } else if (subVal === 'file') {
        const fileVal = document.getElementById('git-discard-input').value;
        command = `git checkout -- ${fileVal || '[file-path]'}`;
      }
    } else if (category === 'branches') {
      const subVal = document.getElementById('git-branch-select').value;
      const branchVal = document.getElementById('git-branch-input').value;
      if (subVal === 'create') {
        command = `git checkout -b ${branchVal || '[branch-name]'}`;
      } else if (subVal === 'rename') {
        command = `git branch -m ${branchVal || '[new-branch-name]'}`;
      } else if (subVal === 'delete') {
        command = `git branch -d ${branchVal || '[branch-name]'}`;
      } else if (subVal === 'merge') {
        command = `git merge ${branchVal || '[branch-name]'}`;
      }
    } else if (category === 'stash') {
      const subVal = document.getElementById('git-stash-select').value;
      if (subVal === 'save') {
        const stashMsg = document.getElementById('git-stash-input').value;
        command = stashMsg ? `git stash save "${stashMsg.replace(/"/g, '\\"')}"` : 'git stash';
      } else if (subVal === 'apply') {
        command = 'git stash apply';
      } else if (subVal === 'pop') {
        command = 'git stash pop';
      } else if (subVal === 'list') {
        command = 'git stash list';
      }
    }

    textareaOutput.value = command;
  }

  // Event hooks
  selectCategory.addEventListener('change', updateOptions);
  
  // Copy Event
  btnCopy.addEventListener('click', () => {
    if (!textareaOutput.value) return;
    navigator.clipboard.writeText(textareaOutput.value).then(() => {
      elAlert.style.display = 'block';
      setTimeout(() => {
        elAlert.style.display = 'none';
      }, 2000);
    });
  });

  // Initial trigger
  updateOptions();
}
