/* promptHelper.js - AI Prompt Engineer Helper & Template Builder */

export function initPromptHelperTool() {
  const selectRole = document.getElementById('prompt-role-select');
  const divDynamicInputs = document.getElementById('prompt-dynamic-inputs');
  const txtOutput = document.getElementById('prompt-output');
  const btnCopy = document.getElementById('prompt-copy-btn');
  const btnClear = document.getElementById('prompt-clear-btn');
  const elAlert = document.getElementById('prompt-alert');

  if (!selectRole || !txtOutput) return;

  function getLang() {
    return localStorage.getItem('app-lang') || 'en';
  }

  // Predefined prompt structures
  const templates = {
    reviewer: {
      render: (lang) => `
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '目标编程语言' : 'Programming Language'}</label>
          <input type="text" class="form-control prompt-field" id="p-rev-lang" value="JavaScript">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '优化侧重点' : 'Focus Areas'}</label>
          <input type="text" class="form-control prompt-field" id="p-rev-focus" value="Readability, performance, and security">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '待评审代码' : 'Code Snippet to Review'}</label>
          <textarea class="form-control prompt-field" id="p-rev-code" placeholder="Paste your code here..."></textarea>
        </div>
      `,
      build: (lang) => {
        const pLang = document.getElementById('p-rev-lang')?.value || 'JavaScript';
        const pFocus = document.getElementById('p-rev-focus')?.value || 'Performance';
        const pCode = document.getElementById('p-rev-code')?.value || '';
        
        if (lang === 'cn') {
          return `你是一位资深的软件工程师与代码评审专家。请严格按照以下要求对我提供的 ${pLang} 代码进行深度评审：

### 评审要点：
- 侧重于：${pFocus}。
- 检查是否存在潜在的安全漏洞、边界溢出或性能瓶颈。
- 检查代码可读性与命名规范，是否符合行业最佳实践。
- 提供具体的重构建议并输出修改后的代码片段。

### 待评审代码：
\`\`\`${pLang.toLowerCase()}
${pCode}
\`\`\`

请分步列出发现的问题，给出原因，并提供优化后的完整代码方案。`;
        } else {
          return `You are an expert senior software engineer and code quality reviewer. Please review my ${pLang} code snippet below based on the following instructions:

### Review Constraints & Objectives:
- Primary focus: ${pFocus}.
- Verify security vulnerabilities, edge-case safety, and code runtime performance.
- Comment on code readability, structures, naming conventions, and best practices.
- Output actionable refactoring advice alongside code modifications.

### Code to Review:
\`\`\`${pLang.toLowerCase()}
${pCode}
\`\`\`

Analyze step by step, itemize issues discovered with rationale, and provide the updated complete codebase block.`;
        }
      }
    },
    translator: {
      render: (lang) => `
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '目标语言' : 'Target Language'}</label>
          <input type="text" class="form-control prompt-field" id="p-trans-target" value="English">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '翻译语气/风格' : 'Tone / Style'}</label>
          <input type="text" class="form-control prompt-field" id="p-trans-tone" value="Professional & concise">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '需要翻译的文本' : 'Source Text'}</label>
          <textarea class="form-control prompt-field" id="p-trans-text" placeholder="Type or paste source text here..."></textarea>
        </div>
      `,
      build: (lang) => {
        const pTarget = document.getElementById('p-trans-target')?.value || 'English';
        const pTone = document.getElementById('p-trans-tone')?.value || 'Professional';
        const pText = document.getElementById('p-trans-text')?.value || '';
        
        if (lang === 'cn') {
          return `你是一位专业级翻译家和本地化润色专家。请将以下文本翻译为【${pTarget}】：

### 翻译要求：
- 语气风格：${pTone}。
- 确保符合目标语言的母语表达习惯，翻译需自然、准确。
- 保留原始排版、Markdown 标记及专有名词不翻译。
- 不需要任何解释，仅输出翻译后的最终结果。

### 待翻译文本：
---
${pText}
---`;
        } else {
          return `You are a professional translator and copy editor. Translate the following text into 【${pTarget}】:

### Translation Directives:
- Intended Tone & Style: ${pTone}.
- Adapt the translation to read naturally as if written by a native speaker.
- Preserve formatting, Markdown elements, structure, and technical terms.
- Do not add any conversational meta-text or explanation; return only the translated content.

### Text to Translate:
---
${pText}
---`;
        }
      }
    },
    copywriter: {
      render: (lang) => `
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '产品 / 主题名称' : 'Product / Topic Name'}</label>
          <input type="text" class="form-control prompt-field" id="p-copy-name" value="Plobi-kit">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '目标受众' : 'Target Audience'}</label>
          <input type="text" class="form-control prompt-field" id="p-copy-audience" value="Web developers and designers">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '投放平台 / 载体' : 'Platform / Medium'}</label>
          <input type="text" class="form-control prompt-field" id="p-copy-platform" value="Twitter/X post">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '核心痛点 / 特点' : 'Key Features & Pain Points'}</label>
          <textarea class="form-control prompt-field" id="p-copy-features" placeholder="e.g. Free, no server-upload, 100% private, offline support..."></textarea>
        </div>
      `,
      build: (lang) => {
        const pName = document.getElementById('p-copy-name')?.value || 'Plobi-kit';
        const pAudience = document.getElementById('p-copy-audience')?.value || 'Developers';
        const pPlatform = document.getElementById('p-copy-platform')?.value || 'Twitter';
        const pFeatures = document.getElementById('p-copy-features')?.value || '';

        if (lang === 'cn') {
          return `你是一位精通互联网传播的资深文案策划大师。请为我的产品【${pName}】创作一篇适用于【${pPlatform}】的文案。

### 核心参数：
- 目标受众：${pAudience}。
- 平台媒介：${pPlatform}。
- 核心卖点与功能：${pFeatures}。

### 文案要求：
- 语言极具吸引力，直击目标受众的核心痛点。
- 结构清晰，便于阅读（在需要的地方适当使用 emoji 和换行）。
- 包含清晰的 Call to Action (行动呼吁)。
- 生成 3 个不同版本的文案（分别偏向专业、幽默和痛点激发）供我选择。`;
        } else {
          return `You are an elite conversion copywriter and content strategist. Create engaging copy for my product 【${pName}】 tailored to 【${pPlatform}】.

### Marketing Parameters:
- Target Audience: ${pAudience}.
- Platform / Medium: ${pPlatform}.
- Key Selling Points: ${pFeatures}.

### Copywriting Directives:
- Write punchy, engaging hooks that address customer pain points directly.
- Ensure optimal readability with structured formatting (use bullet points or emojis appropriately).
- Conclude with a strong, unambiguous Call to Action (CTA).
- Provide 3 distinct variations (e.g., professional, humorous, and urgency-driven) for me to test.`;
        }
      }
    },
    custom: {
      render: (lang) => `
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? 'AI 设定的角色 / 身份' : 'AI Persona / Role'}</label>
          <input type="text" class="form-control prompt-field" id="p-cust-role" value="Expert UI Consultant">
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'cn' ? '核心任务与指令' : 'Task Instructions'}</label>
          <textarea class="form-control prompt-field" id="p-cust-task" placeholder="Describe what the AI must do step-by-step..."></textarea>
        </div>
      `,
      build: (lang) => {
        const pRole = document.getElementById('p-cust-role')?.value || 'Expert Assistant';
        const pTask = document.getElementById('p-cust-task')?.value || '';

        if (lang === 'cn') {
          return `你是一位卓越的【${pRole}】。请严格遵循我的指令完成以下任务：

### 任务说明：
${pTask}

### 约束条件：
- 思考过程请遵循“一步一步思考”的原则，确保逻辑严密。
- 回答结构清晰，使用 markdown 排版，避免冗长废话。`;
        } else {
          return `You are a world-class 【${pRole}】. Please execute the following task under my strict guidance:

### Task Guidelines:
${pTask}

### Constraints:
- Think step by step to ensure analytical accuracy and logic validation.
- Format the response using clean Markdown structures. Avoid conversational fluff.`;
        }
      }
    }
  };

  function renderInputs() {
    const lang = getLang();
    const role = selectRole.value;
    const template = templates[role];
    if (template && divDynamicInputs) {
      divDynamicInputs.innerHTML = template.render(lang);
      
      // Bind event listeners to new dynamic input fields
      divDynamicInputs.querySelectorAll('.prompt-field').forEach(input => {
        input.addEventListener('input', generatePrompt);
      });
      generatePrompt();
    }
  }

  function generatePrompt() {
    const lang = getLang();
    const role = selectRole.value;
    const template = templates[role];
    if (template) {
      txtOutput.value = template.build(lang).trim();
    }
  }

  // Handle template role changes
  selectRole.addEventListener('change', renderInputs);

  // Initialize once
  renderInputs();

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      // Clear inputs based on current role
      divDynamicInputs.querySelectorAll('.prompt-field').forEach(input => {
        input.value = '';
      });
      generatePrompt();
    });
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (!txtOutput.value) return;
      navigator.clipboard.writeText(txtOutput.value).then(() => {
        if (elAlert) {
          elAlert.style.display = 'block';
          setTimeout(() => elAlert.style.display = 'none', 2000);
        }
      });
    });
  }
}
