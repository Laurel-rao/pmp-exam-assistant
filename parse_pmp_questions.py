import re
import json
from typing import Dict, List, Optional

class PMPQuestionParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.questions: List[Dict] = []
        
    def read_file(self) -> str:
        """读取文件内容"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            return f.read()
            
    def parse_question(self, text: str) -> Optional[Dict]:
        """解析单个题目"""
        # 匹配题目编号和类型
        header_match = re.search(r'(\d+)．【(单选题|多选题)】(.*?)(?=A、|$)', text, re.DOTALL)
        if not header_match:
            return None
            
        question_id = int(header_match.group(1))
        question_type = header_match.group(2)
        question_text = header_match.group(3).strip()
        
        # 匹配选项
        options = {}
        option_pattern = re.compile(r'([A-E])、([^A-E]+?)(?=[A-E]、|答案|$)', re.DOTALL)
        for match in option_pattern.finditer(text):
            option_letter = match.group(1)
            option_text = match.group(2).strip('。').strip()
            options[option_letter] = option_text
            
        # 匹配答案
        answer_match = re.search(r'答案:\s*([A-E](?:\s*[,，]\s*[A-E])*)', text)
        if not answer_match:
            return None
            
        answer = answer_match.group(1)
        # 处理多选题答案
        if question_type == "多选题":
            answer = [a.strip() for a in re.split(r'[,，]', answer)]
        
        # 匹配解析
        explanation_match = re.search(r'解析[：:](.*?)(?=\n\n\d+．|$)', text, re.DOTALL)
        explanation = explanation_match.group(1).strip() if explanation_match else ""
        
        return {
            "id": question_id,
            "type": question_type,
            "question": question_text,
            "options": options,
            "answer": answer,
            "explanation": explanation
        }
        
    def parse_all_questions(self) -> List[Dict]:
        """解析所有题目"""
        content = self.read_file()
        # 使用题号作为分隔符
        questions_text = re.split(r'\n\n+(?=\d+．【)', content)
        
        for text in questions_text:
            if not text.strip():
                continue
            question = self.parse_question(text)
            if question:
                self.questions.append(question)
                
        return self.questions
        
    def save_to_json(self, output_file: str):
        """保存到 JSON 文件"""
        data = {
            "exam_info": {
                "title": "PMP考试题目集",
                "total_questions": len(self.questions),
                "description": "本题库包含PMP考试相关的单选题和多选题，涵盖项目管理各个知识领域"
            },
            "questions": self.questions
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    parser = PMPQuestionParser('data.md')
    questions = parser.parse_all_questions()
    parser.save_to_json('pmp_questions_new.json')
    print(f"成功解析 {len(questions)} 道题目")

if __name__ == '__main__':
    main() 