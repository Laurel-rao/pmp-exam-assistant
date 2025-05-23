// 全局变量
let questions = [];
let currentQuestionIndex = 0;
let examAnswers = [];
let examTimer = null;
let startTime = null;
let examHistory = [];
let wrongQuestions = {};

// 学习模式变量
let isLearningMode = false;
let learningStats = {
    correct: 0,
    wrong: 0,
    answered: false
};

// 从 localStorage 加载数据
function loadData() {
    const savedHistory = localStorage.getItem('examHistory');
    if (savedHistory) {
        examHistory = JSON.parse(savedHistory);
    }
    
    const savedWrongQuestions = localStorage.getItem('wrongQuestions');
    if (savedWrongQuestions) {
        wrongQuestions = JSON.parse(savedWrongQuestions);
    }
    
    updateHistoryDisplay();
    updateWrongStatistics();
}

// 保存数据到 localStorage
function saveData() {
    localStorage.setItem('examHistory', JSON.stringify(examHistory));
    localStorage.setItem('wrongQuestions', JSON.stringify(wrongQuestions));
}

// 更新考试历史显示
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('exam-history');
    historyContainer.innerHTML = examHistory.map((exam, index) => `
        <div class="bg-gray-50 p-4 rounded-lg">
            <p class="font-semibold">考试 ${index + 1}</p>
            <p>得分：${exam.score}分</p>
            <p>用时：${exam.timeUsed}</p>
            <p>日期：${new Date(exam.date).toLocaleString()}</p>
        </div>
    `).join('');
}

// 更新错题统计显示
function updateWrongStatistics() {
    const statsContainer = document.getElementById('wrong-statistics');
    statsContainer.innerHTML = Object.entries(wrongQuestions)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([id, data]) => `
            <div class="bg-gray-50 p-4 rounded-lg">
                <p class="font-semibold">题目 ${id}</p>
                <p>错误次数：${data.count}</p>
                <p>最后错误：${new Date(data.lastWrong).toLocaleDateString()}</p>
            </div>
        `).join('');
}

// 开始新考试
async function startExam() {
    try {
        const response = await fetch('pmp_questions_new.json');
        const data = await response.json();
        questions = data.questions;
        
        // 随机选择 50 道题目
        questions = shuffleArray(questions).slice(0, 50);
        
        currentQuestionIndex = 0;
        examAnswers = new Array(questions.length).fill(null);
        
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('exam-container').classList.remove('hidden');
        document.getElementById('result-container').classList.add('hidden');
        
        startTimer();
        displayQuestion();
    } catch (error) {
        console.error('加载题目失败：', error);
        alert('加载题目失败，请刷新页面重试');
    }
}

// 显示错题练习
function showWrongQuestions() {
    const wrongIds = Object.keys(wrongQuestions);
    if (wrongIds.length === 0) {
        alert('暂无错题记录');
        return;
    }
    
    questions = questions.filter(q => wrongIds.includes(q.id.toString()));
    startExam();
}

// 打乱数组顺序
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 开始计时器
function startTimer() {
    startTime = new Date();
    examTimer = setInterval(() => {
        const now = new Date();
        const diff = now - startTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        document.getElementById('timer').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// 停止计时器
function stopTimer() {
    if (examTimer) {
        clearInterval(examTimer);
        examTimer = null;
    }
}

// 显示当前题目
function displayQuestion() {
    const question = questions[currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6 question-card">
            <div class="mb-4">
                <span class="text-sm text-gray-500">题目 ${currentQuestionIndex + 1}/${questions.length}</span>
                <h3 class="text-lg font-semibold mt-2">${question.question}</h3>
            </div>
            <div class="space-y-2">
                ${Object.entries(question.options).map(([key, value]) => `
                    <label class="block p-3 rounded-lg option-label ${examAnswers[currentQuestionIndex] === key ? 'selected' : ''}">
                        <input type="radio" name="answer" value="${key}" ${examAnswers[currentQuestionIndex] === key ? 'checked' : ''} class="mr-2">
                        ${key}. ${value}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    
    // 添加选项点击事件
    const options = container.querySelectorAll('input[type="radio"]');
    options.forEach(option => {
        option.addEventListener('change', (e) => {
            examAnswers[currentQuestionIndex] = e.target.value;
            document.querySelectorAll('.option-label').forEach(label => {
                label.classList.remove('selected');
            });
            e.target.closest('.option-label').classList.add('selected');
        });
    });
    
    // 更新导航按钮状态
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    document.getElementById('next-btn').textContent = 
        currentQuestionIndex === questions.length - 1 ? '完成' : '下一题';
    document.getElementById('submit-btn').classList.toggle('hidden', 
        currentQuestionIndex !== questions.length - 1);
}

// 上一题
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// 下一题
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        submitExam();
    }
}

// 提交考试
function submitExam() {
    if (!confirm('确定要提交试卷吗？')) {
        return;
    }
    
    stopTimer();
    const timeUsed = document.getElementById('timer').textContent;
    
    let correctCount = 0;
    const wrongAnswers = [];
    
    questions.forEach((question, index) => {
        const userAnswer = examAnswers[index];
        const isCorrect = userAnswer === question.answer;
        
        if (isCorrect) {
            correctCount++;
        } else {
            wrongAnswers.push(question.id);
            // 更新错题统计
            if (!wrongQuestions[question.id]) {
                wrongQuestions[question.id] = {
                    count: 0,
                    lastWrong: null
                };
            }
            wrongQuestions[question.id].count++;
            wrongQuestions[question.id].lastWrong = new Date().toISOString();
        }
    });
    
    const score = Math.round((correctCount / questions.length) * 100);
    
    // 保存考试记录
    examHistory.push({
        date: new Date().toISOString(),
        score,
        timeUsed,
        totalQuestions: questions.length,
        correctCount,
        wrongAnswers
    });
    
    saveData();
    showResult(score, timeUsed, correctCount);
}

// 显示考试结果
function showResult(score, timeUsed, correctCount) {
    document.getElementById('exam-container').classList.add('hidden');
    document.getElementById('result-container').classList.remove('hidden');
    
    document.getElementById('score').textContent = score;
    document.getElementById('time-used').textContent = timeUsed;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('wrong-count').textContent = questions.length - correctCount;
}

// 查看解析
function reviewExam() {
    const container = document.getElementById('result-container');
    container.innerHTML += `
        <div class="space-y-6">
            ${questions.map((question, index) => `
                <div class="bg-white rounded-lg shadow p-6 ${examAnswers[index] === question.answer ? 'correct' : 'wrong'}">
                    <h3 class="text-lg font-semibold">${index + 1}. ${question.question}</h3>
                    <div class="space-y-2 mt-4">
                        ${Object.entries(question.options).map(([key, value]) => `
                            <div class="p-3 rounded-lg ${
                                key === question.answer ? 'bg-green-100' :
                                key === examAnswers[index] ? 'bg-red-100' : ''
                            }">
                                ${key}. ${value}
                                ${key === question.answer ? ' ✓' : 
                                  key === examAnswers[index] && key !== question.answer ? ' ✗' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p class="font-semibold">解析：</p>
                        <p>${question.explanation}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 返回主菜单
function returnToMain() {
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('exam-container').classList.add('hidden');
    document.getElementById('result-container').classList.add('hidden');
    document.getElementById('learning-container').classList.add('hidden');
    
    // 重置学习模式
    if (isLearningMode) {
        isLearningMode = false;
        learningStats = {
            correct: 0,
            wrong: 0,
            answered: false
        };
    }
    
    updateHistoryDisplay();
    updateWrongStatistics();
}

// 开始学习模式
async function startLearningMode() {
    try {
        const response = await fetch('pmp_questions_new.json');
        const data = await response.json();
        questions = shuffleArray(data.questions);
        
        currentQuestionIndex = 0;
        isLearningMode = true;
        learningStats = {
            correct: 0,
            wrong: 0,
            answered: false
        };
        
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('exam-container').classList.add('hidden');
        document.getElementById('result-container').classList.add('hidden');
        document.getElementById('learning-container').classList.remove('hidden');
        
        displayLearningQuestion();
        updateLearningStats();
    } catch (error) {
        console.error('加载题目失败：', error);
        alert('加载题目失败，请刷新页面重试');
    }
}

// 显示学习模式的题目
function displayLearningQuestion() {
    const question = questions[currentQuestionIndex];
    const container = document.getElementById('learning-question-container');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-6 question-card">
            <div class="mb-4">
                <span class="text-sm text-gray-500">题目 ${currentQuestionIndex + 1}/${questions.length}</span>
                <h3 class="text-lg font-semibold mt-2">${question.question}</h3>
            </div>
            <div class="space-y-2" id="options-container">
                ${Object.entries(question.options).map(([key, value]) => `
                    <label class="block p-3 rounded-lg option-label" data-option="${key}">
                        <input type="radio" name="learning-answer" value="${key}" class="mr-2" ${learningStats.answered ? 'disabled' : ''}>
                        ${key}. ${value}
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    
    // 隐藏解析
    document.getElementById('learning-explanation').classList.add('hidden');
    learningStats.answered = false;
    
    // 使用事件委托来处理选项点击
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.addEventListener('change', handleLearningAnswer);
    
    // 更新导航按钮状态
    document.getElementById('learning-prev-btn').disabled = currentQuestionIndex === 0;
    document.getElementById('learning-next-btn').disabled = !learningStats.answered;
}

// 处理学习模式的答题
function handleLearningAnswer(e) {
    if (!e.target.matches('input[type="radio"]')) return;
    if (learningStats.answered) return;
    
    const selectedAnswer = e.target.value;
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.answer;
    
    // 更新统计
    if (isCorrect) {
        learningStats.correct++;
    } else {
        learningStats.wrong++;
    }
    learningStats.answered = true;
    
    // 显示正确和错误选项
    const options = document.querySelectorAll('.option-label');
    options.forEach(option => {
        const optionValue = option.dataset.option;
        if (optionValue === question.answer) {
            option.classList.add('correct');
        } else if (optionValue === selectedAnswer && !isCorrect) {
            option.classList.add('wrong');
        }
        option.querySelector('input').disabled = true;
    });
    
    // 显示解析
    const explanationContainer = document.getElementById('learning-explanation');
    const explanationContent = document.getElementById('learning-explanation-content');
    explanationContent.innerHTML = `
        <div class="mb-4">
            <span class="font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}">
                ${isCorrect ? '回答正确！' : '回答错误！'}
            </span>
            <span class="ml-2">正确答案：${question.answer}</span>
        </div>
        <div class="text-gray-700">
            ${question.explanation}
        </div>
    `;
    explanationContainer.classList.remove('hidden');
    
    // 更新统计显示
    updateLearningStats();
    
    // 启用下一题按钮
    document.getElementById('learning-next-btn').disabled = false;
}

// 更新学习统计
function updateLearningStats() {
    const total = learningStats.correct + learningStats.wrong;
    const accuracy = total === 0 ? 0 : Math.round((learningStats.correct / total) * 100);
    
    document.getElementById('learning-correct').textContent = learningStats.correct;
    document.getElementById('learning-wrong').textContent = learningStats.wrong;
    document.getElementById('learning-accuracy').textContent = `${accuracy}%`;
}

// 上一道学习题目
function previousLearningQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayLearningQuestion();
    }
}

// 下一道学习题目
function nextLearningQuestion() {
    if (!learningStats.answered) {
        alert('请先回答当前题目');
        return;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayLearningQuestion();
    } else {
        if (confirm('已经是最后一题了，是否返回主菜单？')) {
            returnToMain();
        }
    }
}

// 导出题库为 Markdown 格式
async function exportQuestions(includeAnswers) {
    try {
        const response = await fetch('pmp_questions_new.json');
        const data = await response.json();
        
        // 生成 Markdown 内容
        let markdown = `# ${data.exam_info.title}\n\n`;
        markdown += `> ${data.exam_info.description}\n\n`;
        markdown += `总题数：${data.exam_info.total_questions}\n\n`;
        markdown += `---\n\n`;
        
        // 添加题目
        data.questions.forEach((q, index) => {
            // 题目编号和类型
            markdown += `## ${q.id}. ${q.type}\n\n`;
            
            // 题目内容
            markdown += `${q.question}\n\n`;
            
            // 选项
            Object.entries(q.options).forEach(([key, value]) => {
                markdown += `${key}. ${value}\n\n`;
            });
            
            // 如果包含答案，添加答案和解析
            if (includeAnswers) {
                markdown += `**正确答案：${q.answer}**\n\n`;
                markdown += `**解析：**\n\n${q.explanation}\n\n`;
            }
            
            // 添加分隔线
            markdown += `---\n\n`;
        });
        
        // 创建 Blob 对象
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = includeAnswers ? 'pmp_questions_full.md' : 'pmp_questions_no_answers.md';
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // 提示用户
        alert(includeAnswers ? '完整题库已导出为 Markdown 格式！' : '题库（不含答案）已导出为 Markdown 格式！');
    } catch (error) {
        console.error('导出题库失败：', error);
        alert('导出题库失败，请重试');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', loadData); 