const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// .env 파일 읽기
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? 'Anthropic API 사용 중' : 'Anthropic API 키 없음');

const app = express();
const PORT = process.env.PORT || 3000;

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key-here',
});

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname)));

// 다양한 주제 풀 정의
const topicPool = [
    // 정치/행정
    "선거제도 개편", "지방자치 강화", "정치자금 투명화", "국회 개혁", "대통령제 vs 내각제", "정당정치 개선",
    
    // 경제/금융
    "기본소득제 도입", "암호화폐 규제", "부동산 정책", "최저임금 인상", "탄소세 도입", "금융투자세 신설",
    "중소기업 지원정책", "경제성장률 목표", "인플레이션 대응", "국가부채 관리",
    
    // 사회/복지
    "사회적 거리두기", "고령화 사회 대응", "청년실업 해결", "저출산 대책", "다문화 정책", "사회적 약자 보호",
    "공공의료 확대", "사회보장제도 개편", "젠더 갈등 해소", "세대 갈등 완화",
    
    // 문화/예술
    "한류 문화 정책", "전통문화 보존", "저작권 보호", "문화다양성 증진", "공연예술 지원", "미디어 규제",
    "게임 산업 육성", "웹툰 산업 발전", "K-콘텐츠 해외진출", "문화재 디지털화",
    
    // 윤리/철학
    "인공지능 윤리", "생명윤리 논란", "동물권 보호", "안락사 합법화", "개인정보 보호", "알고리즘 편향성",
    "유전자 편집 윤리", "뇌과학 연구 윤리", "의료진의 치료거부권", "종교의 자유",
    
    // 생명과학/의료
    "코로나19 백신 정책", "줄기세포 치료", "정밀의료 도입", "원격의료 확대", "의료 AI 활용", "신약 개발 지원",
    "GMO 식품 안전성", "개인맞춤형 치료", "희귀질환 치료", "노화 방지 연구",
    
    // 화학/신소재
    "화학물질 안전관리", "신소재 개발 투자", "배터리 기술 혁신", "플라스틱 대체재", "촉매 기술 발전", "나노기술 응용",
    "친환경 화학 공정", "바이오플라스틱 개발", "수소에너지 저장", "반도체 소재 개발",
    
    // 물리/에너지
    "핵에너지 활용", "양자컴퓨터 개발", "초전도체 연구", "핵융합 발전", "태양광 발전 확대", "풍력발전 정책",
    "에너지 저장 기술", "스마트그리드 구축", "신재생에너지 전환", "원자력 발전소 정책",
    
    // 지구과학/환경
    "기후변화 대응", "미세먼지 저감", "해수면 상승 대책", "자연재해 예방", "생물다양성 보전", "사막화 방지",
    "지하수 보호", "토양 오염 정화", "대기질 개선", "해양 플라스틱 정화",
    
    // IT/정보통신
    "5G 네트워크 구축", "사이버 보안 강화", "디지털 전환 정책", "클라우드 퍼스트", "빅데이터 활용", "IoT 확산",
    "블록체인 기술 도입", "디지털 플랫폼 규제", "온라인 교육 플랫폼", "디지털 격차 해소",
    
    // 4차 산업혁명
    "스마트팩토리 구축", "자율주행차 상용화", "드론 활용 확대", "로봇 자동화", "3D 프린팅 산업", "메타버스 생태계",
    "디지털 트윈 기술", "엣지 컴퓨팅", "스마트시티 건설", "Industry 4.0 전략",
    
    // 시사/현대이슈
    "가짜뉴스 대응", "소셜미디어 규제", "온라인 혐오표현", "디지털 성범죄", "사이버 불링", "플랫폼 노동자 보호",
    "배달앱 수수료 논란", "공유경제 확산", "구독경제 모델", "ESG 경영 확산",
    
    // 교육/인재
    "대학입시 제도", "평생교육 체계", "직업교육 강화", "온라인 교육 확산", "에듀테크 도입", "교육격차 해소",
    "창의교육 확대", "SW 교육 의무화", "다문화교육 강화", "특수교육 지원",
    
    // 국제관계/외교
    "자유무역협정", "국제개발협력", "기후변화 협약", "사이버 안보 협력", "문화외교 강화", "경제제재 정책",
    "다자외교 확대", "국제기구 역할", "난민 수용 정책", "글로벌 거버넌스"
];

// 랜덤 주제 선택 함수
function getRandomTopic() {
    return topicPool[Math.floor(Math.random() * topicPool.length)];
}

// 1단계: Claude용 논증 구조 설계 프롬프트
function buildClaudeArgumentStructurePrompt(topic, criteria, difficulty) {
    const hasArgumentSupport = criteria.some(c => c.includes('근거가 결론을 뒷받침해'));

    // 각 지침에 대한 명확한 정의 제공
    const guidelineDefinitions = {
        '애매함': '단어나 문장이 여러 의미로 해석될 수 있어 무엇을 의미하는지 불분명한 경우 (예: "공정한 경쟁", "성공적인 정책" - 구체적 의미가 불분명)',
        '모호함': '단어나 개념의 경계가 불분명해서 어디까지가 그 범주에 속하는지 판단하기 어려운 경우 (예: "많은 사람", "상당한 효과" - 정확한 기준이 없음)',
        '거짓은 없어?': '사실이 아니거나 확인할 수 없는 정보를 포함한 경우 (허위 통계, 확인 불가능한 주장 등)',
        '논리적으로 타당해?': '전제에서 결론으로 이어지는 논리적 연결에 오류가 있는 경우 (논리적 비약, 잘못된 추론 등)',
        '충분히 뒷받침돼?': '주장에 비해 근거가 부족하거나 약한 경우 (표면적 근거, 불충분한 증거 등)',
        '편향은 없어?': '특정 관점에만 치우쳐 균형잡힌 시각을 제시하지 못한 경우 (일방적 서술, 반대 의견 무시 등)',
        '관련성이 있어?': '주제와 직접적 관련이 없는 내용을 포함한 경우 (화제 전환, 무관한 근거 등)',
        '적절한 근거야?': '근거의 종류나 질이 주장에 적합하지 않은 경우 (개인 경험을 일반화, 부적절한 권위 인용 등)',
        '일관성이 있어?': '논증 내에서 모순되거나 상충하는 내용이 있는 경우 (자기모순, 일관성 부족 등)',
        '결론이 쟁점에 맞아?': '주어진 논제나 핵심 쟁점과 관련 없는 다른 주제로 화제를 전환하는 경우. 반드시 "그런데 더 중요한 것은...", "하지만 진짜 문제는...", "이보다 우선되어야 할 것은..." 같은 표현으로 완전히 다른 주제(환경, 교육, 경제, 인권 등)를 언급하여 논점을 이탈시켜야 함',
        '쟁점에 맞아?': '주어진 논제나 핵심 쟁점과 관련 없는 다른 주제로 화제를 전환하는 경우. 반드시 "그런데 더 중요한 것은...", "하지만 진짜 문제는...", "이보다 우선되어야 할 것은..." 같은 표현으로 완전히 다른 주제(환경, 교육, 경제, 인권 등)를 언급하여 논점을 이탈시켜야 함'
    };

    // 선택된 지침들의 정의를 추가
    let guidelineContext = '';
    criteria.forEach(criterion => {
        if (guidelineDefinitions[criterion]) {
            guidelineContext += `\n- "${criterion}": ${guidelineDefinitions[criterion]}`;
        }
    });

    let errorCreationInstruction;
    
    // '결론이 쟁점에 맞아?' 지침에 대한 특별 처리
    if (criteria.includes('결론이 쟁점에 맞아?') || criteria.includes('쟁점에 맞아?')) {
        errorCreationInstruction = `먼저, 논점을 이탈시키는 **화제 전환 문장**을 만드세요. 반드시 다음 패턴 중 하나를 사용해야 합니다:
        - "그런데 더 중요한 것은 [완전히 다른 주제]입니다"
        - "하지만 진짜 문제는 [완전히 다른 주제]입니다" 
        - "이보다 우선되어야 할 것은 [완전히 다른 주제]입니다"
        
        [완전히 다른 주제] 예시: 환경 보호, 교육 개혁, 경제 성장, 인권 보장, 사회 안전망, 기술 혁신 등
        
        **중요**: "${topic}"와 직접 관련된 내용이 아닌, 완전히 다른 분야의 주제로 전환해야 합니다.`;
    } else if (hasArgumentSupport) {
        errorCreationInstruction = `먼저, 주장을 제대로 뒷받침하지 못하는 **잘못된 근거** 문장을 하나 만드세요. (예: 무관한 근거, 불충분한 증거 등)`;
    } else {
        errorCreationInstruction = `먼저, 다음 지침을 위반하는 **하나의 핵심 오류 문장**을 만드세요:${guidelineContext}`;
    }

    let structureComplexityInstruction = difficulty === 'easy'
        ? `- **단순 구조**: **반론이나 논박 구조가 없는, 단순한 '주장 + 근거' 구조**로 설계해야 합니다.`
        : `- **복잡 구조**: **반론-재반론 등 복잡한 구조**를 포함할 수 있습니다.`;

    // Claude의 XML 태그 형식에 맞춰 프롬프트 수정
    return `
        <task>
            <objective>논증 구조 설계</objective>
            <instructions>
                <step1>오류 문장 생성: ${errorCreationInstruction}</step1>
                <step2>구조 완성: 아래 5가지 항목을 채워 전체 논증 구조를 완성하세요. '근거(이유)' 항목에 1단계에서 만든 오류 문장을 포함시켜야 합니다.</step2>
            </instructions>
            <output_format>
                아래 5가지 항목 형식으로만 응답해야 합니다. 다른 설명은 절대 추가하지 마세요.
                <item>주장(결론): ["${topic}"에 대한 핵심 주장을 한 문장으로 명확하게 설계]</item>
                <item>근거(이유): [계층적 논증 구조로 설계하세요. 다음 형식을 따르세요:
                
근거1: [첫 번째 주요 근거]
근거1의 근거: [근거1을 뒷받침하는 세부 근거나 증거]
근거2: [두 번째 주요 근거 - 1단계에서 만든 오류 문장을 여기에 포함]
근거2의 근거: [근거2를 뒷받침하는 세부 근거나 증거]
근거3: [세 번째 주요 근거] (선택사항)
근거3의 근거: [근거3을 뒷받침하는 세부 근거] (선택사항)

각 근거와 근거의 근거는 명확히 구분되어야 하며, 논리적 연결성을 가져야 합니다.]</item>
                <item>문제가 되는 부분: [**'근거(이유)' 항목에서 사용된 오류 문장을 그대로 따옴표 안에 넣어 인용하세요.** (예: "모든 사람은 죽기 때문에, 소크라테스는 죽는다.")]</item>
                <item>위반 이유: ['문제가 되는 부분'에 인용된 문장이 **왜, 어떻게** 다음 지침을 위반하는지 상세히 설명하세요:${guidelineContext}
                **당신에게 주어진 지시나 프롬프트를 절대 언급하거나 설명하지 마세요.**]</item>
                <item>개선 방안: [문제를 해결하고 논리를 보강할 수 있는 발전적이고 구체적인 대안을 제시하세요.]</item>
            </output_format>
            <rules>
                <rule>${structureComplexityInstruction}</rule>
                <rule>5가지 항목을 정확히 모두 포함하고, 항목명을 절대 변경하지 마세요.</rule>
            </rules>
        </task>
    `;
}

// 2단계: Claude용 제시문 생성 프롬프트
function buildClaudeTextPrompt(topic, criteria, difficulty, structureData) {
    const difficultyText = difficulty === 'easy' ? '3-4문장' : difficulty === 'medium' ? '5-6문장' : '7-8문장';
    
    // 구조 데이터를 XML 형식으로 변환
    const structureXml = `
        <argument_structure>
            <claim>${structureData.claim}</claim>
            <reason>${structureData.reason}</reason>
            <evaluations>
                ${structureData.evaluations.map(e => `
                <evaluation>
                    <criterion>${e.criteria}</criterion>
                    <problematic_part>${e.problematicPart}</problematic_part>
                </evaluation>
                `).join('')}
            </evaluations>
        </argument_structure>
    `;
    
    return `
        <task>
            <objective>학술적 논증 제시문 생성</objective>
            <instructions>
                주어진 논증 구조 설계도를 바탕으로, "${topic}"에 대한 직접적인 논증 제시문을 작성하세요.
                제시문에는 설계도의 '근거(이유)' 부분에 명시된 문장들을 **정확히 그대로** 포함시켜야 합니다.
            </instructions>
            <context>
                <topic>${topic}</topic>
                ${structureXml}
            </context>
            <rules>
                <rule>형태: 논증문 자체가 되어야 합니다. (논증을 분석, 비평, 비교하는 글이 아님)</rule>
                <rule>핵심 과업: 설계도에 명시된 'problematic_part'의 논리적 오류를 제시문에 **의도적으로, 그리고 명시적으로 포함**시켜야 합니다.</rule>
                <rule>근거 일치성: 설계도의 '근거(이유)' 항목에 있는 각 문장들을 제시문에 **문자 그대로 정확히** 포함시켜야 합니다. 의미만 비슷하게 하지 말고 정확한 문장을 사용하세요.</rule>
                <rule>스타일: 대학 수준의 학술적 글쓰기</rule>
                <rule>분량: ${difficultyText}</rule>
                <rule>문장부호: 불필요한 따옴표("", '', "", 등)를 사용하지 마세요. 자연스러운 문장으로만 작성하세요.</rule>
                <rule>금지: "이는 마치 ~와 같다" 등의 메타 분석/비교 표현, 설계도에 없는 내용 추가, 설계된 오류 수정, 인용부호 사용</rule>
            </rules>
            <output_format>
                제목 없이 본문만 출력하세요.
            </output_format>
        </task>
    `;
}

// 텍스트 정리 함수 - 불필요한 문장부호 제거
function cleanPromptText(text) {
    if (!text) return text;
    
    return text
        // 모든 종류의 따옴표 제거 (영문, 한글, 중국어 따옴표 포함)
        .replace(/["'"'"'""「」『』]/g, '')
        // 불필요한 기호들 제거
        .replace(/[‚„‛‟]/g, '')
        // 연속된 문장부호 정리
        .replace(/[,]{2,}/g, ',')
        .replace(/[.]{2,}/g, '.')
        .replace(/[!]{2,}/g, '!')
        .replace(/[?]{2,}/g, '?')
        // 불필요한 공백 정리 (탭, 줄바꿈, 연속 공백)
        .replace(/[\t\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        // 문장 시작/끝 공백 제거
        .trim()
        // 마지막에 마침표가 없으면 추가 (단, 물음표나 느낌표가 있으면 제외)
        .replace(/([^.!?])$/, '$1.');
}

// 더미 데이터 생성 함수
function generateDummyPrompt(criteria, difficulty) {
    const dummyTopics = [
        // 정치/행정
        "선거제도 개편", "지방자치 강화", "정치자금 투명화", "국회 개혁", "대통령제 vs 내각제", "정당정치 개선",
        
        // 경제/금융
        "기본소득제 도입", "암호화폐 규제", "부동산 정책", "최저임금 인상", "탄소세 도입", "금융투자세 신설",
        "중소기업 지원정책", "경제성장률 목표", "인플레이션 대응", "국가부채 관리",
        
        // 사회/복지
        "사회적 거리두기", "고령화 사회 대응", "청년실업 해결", "저출산 대책", "다문화 정책", "사회적 약자 보호",
        "공공의료 확대", "사회보장제도 개편", "젠더 갈등 해소", "세대 갈등 완화",
        
        // 문화/예술
        "한류 문화 정책", "전통문화 보존", "저작권 보호", "문화다양성 증진", "공연예술 지원", "미디어 규제",
        "게임 산업 육성", "웹툰 산업 발전", "K-콘텐츠 해외진출", "문화재 디지털화",
        
        // 윤리/철학
        "인공지능 윤리", "생명윤리 논란", "동물권 보호", "안락사 합법화", "개인정보 보호", "알고리즘 편향성",
        "유전자 편집 윤리", "뇌과학 연구 윤리", "의료진의 치료거부권", "종교의 자유",
        
        // 생명과학/의료
        "코로나19 백신 정책", "줄기세포 치료", "정밀의료 도입", "원격의료 확대", "의료 AI 활용", "신약 개발 지원",
        "GMO 식품 안전성", "개인맞춤형 치료", "희귀질환 치료", "노화 방지 연구",
        
        // 화학/신소재
        "화학물질 안전관리", "신소재 개발 투자", "배터리 기술 혁신", "플라스틱 대체재", "촉매 기술 발전", "나노기술 응용",
        "친환경 화학 공정", "바이오플라스틱 개발", "수소에너지 저장", "반도체 소재 개발",
        
        // 물리/에너지
        "핵에너지 활용", "양자컴퓨터 개발", "초전도체 연구", "핵융합 발전", "태양광 발전 확대", "풍력발전 정책",
        "에너지 저장 기술", "스마트그리드 구축", "신재생에너지 전환", "원자력 발전소 정책",
        
        // 지구과학/환경
        "기후변화 대응", "미세먼지 저감", "해수면 상승 대책", "자연재해 예방", "생물다양성 보전", "사막화 방지",
        "지하수 보호", "토양 오염 정화", "대기질 개선", "해양 플라스틱 정화",
        
        // IT/정보통신
        "5G 네트워크 구축", "사이버 보안 강화", "디지털 전환 정책", "클라우드 퍼스트", "빅데이터 활용", "IoT 확산",
        "블록체인 기술 도입", "디지털 플랫폼 규제", "온라인 교육 플랫폼", "디지털 격차 해소",
        
        // 4차 산업혁명
        "스마트팩토리 구축", "자율주행차 상용화", "드론 활용 확대", "로봇 자동화", "3D 프린팅 산업", "메타버스 생태계",
        "디지털 트윈 기술", "엣지 컴퓨팅", "스마트시티 건설", "Industry 4.0 전략",
        
        // 시사/현대이슈
        "가짜뉴스 대응", "소셜미디어 규제", "온라인 혐오표현", "디지털 성범죄", "사이버 불링", "플랫폼 노동자 보호",
        "배달앱 수수료 논란", "공유경제 확산", "구독경제 모델", "ESG 경영 확산",
        
        // 교육/인재
        "대학입시 제도", "평생교육 체계", "직업교육 강화", "온라인 교육 확산", "에듀테크 도입", "교육격차 해소",
        "창의교육 확대", "SW 교육 의무화", "다문화교육 강화", "특수교육 지원",
        
        // 국제관계/외교
        "자유무역협정", "국제개발협력", "기후변화 협약", "사이버 안보 협력", "문화외교 강화", "경제제재 정책",
        "다자외교 확대", "국제기구 역할", "난민 수용 정책", "글로벌 거버넌스"
    ];
    
    const selectedTopic = dummyTopics[Math.floor(Math.random() * dummyTopics.length)];
    
    const criteriaKey = criteria && criteria.length > 0 ? 
        (criteria.includes('근거가 결론을 뒷받침해?') || criteria.includes('support') ? 'support' :
         criteria.includes('명료하지 않아?') || criteria.includes('clarity') ? 'clarity' : 
         criteria.includes('거짓은 없어?') || criteria.includes('truth') ? 'truth' : 
         criteria.includes('결론이 쟁점에 맞아?') || criteria.includes('relevance') ? 'relevance' :
         criteria.includes('다룰만한 가치가 있어?') || criteria.includes('significance') ? 'significance' :
         criteria.includes('논리적으로 일관적이야?') || criteria.includes('consistency') ? 'consistency' :
         criteria.includes('결론은 충분히 정당화 되?') || criteria.includes('justification') ? 'justification' :
         criteria.includes('논의가 공정해?') || criteria.includes('fairness') ? 'fairness' :
         criteria.includes('쟁점에 다각도로 깊이 있게 접근해?') || criteria.includes('depth') ? 'depth' : 'support') 
        : 'support';
    
    const dummyData = {
        support: (() => {
            const patterns = [
                {
                    text: difficulty === 'easy' ? 
                        `${selectedTopic}에 대한 정책을 즉시 시행해야 합니다. 먼저 최근 한 연구에서 관련 지표가 개선되었다는 결과가 나왔습니다. 둘째로 전문가들이 이 분야의 중요성을 강조하고 있습니다. 따라서 우리는 지금 당장 강력한 대책을 마련해야 합니다.` :
                        difficulty === 'normal' ?
                        `${selectedTopic}에 대한 포괄적인 정책을 즉시 시행해야 합니다. 첫 번째 근거로, 최근 한 연구에서 관련 지표가 개선되었다는 결과가 나왔습니다. 이 연구는 국제 학술지에 게재된 권위 있는 연구로 신뢰도가 높습니다. 두 번째로, 시민들의 관심도가 급증하고 있습니다. 따라서 정부는 즉시 근본적이고 체계적인 정책을 시행해야 합니다.` :
                        `${selectedTopic}에 대한 전면적인 정책을 즉시 시행해야 합니다. 첫 번째 근거로, 최근 한 연구에서 관련 지표가 개선되었다는 결과가 나왔습니다. 이 연구는 국제적으로 인정받는 대학 연구진이 3년간 수행한 대규모 연구로서 신뢰성이 매우 높습니다. 두 번째 근거로, 해외 선진국들이 이미 유사한 정책을 도입하고 있습니다. 이는 글로벌 트렌드에 맞추기 위한 필수 조건이며, 경쟁력 확보를 위해서도 시급합니다. 따라서 ${selectedTopic}에 대한 우리의 대응은 더 이상 늦출 수 없는 국가적 과제입니다.`,
                    analysis: difficulty === 'easy' ?
                        `**주장(결론)**: ${selectedTopic}에 대한 정책을 즉시 시행해야 합니다.
**근거1**: 최근 한 연구에서 관련 지표가 개선되었다는 결과가 나왔습니다.
**근거2**: 전문가들이 이 분야의 중요성을 강조하고 있습니다.
**문제가 되는 부분**: 단일 연구 결과와 모호한 전문가 의견만으로 정책 시행을 주장하는 근거 부족
**위반 이유**: 하나의 연구와 구체적이지 않은 전문가 의견은 전체 정책의 필요성을 충분히 입증하지 못함
**개선 방안**: 다양한 연구 결과, 구체적인 전문가 의견, 실증 데이터를 종합적으로 제시` :
                        difficulty === 'normal' ?
                        `**주장(결론)**: ${selectedTopic}에 대한 포괄적인 정책을 즉시 시행해야 합니다.
**근거1**: 최근 한 연구에서 관련 지표가 개선되었다는 결과가 나왔습니다.
**근거1의 근거**: 이 연구는 국제 학술지에 게재된 권위 있는 연구로 신뢰도가 높습니다.
**근거2**: 시민들의 관심도가 급증하고 있습니다.
**문제가 되는 부분**: 단일 연구의 권위성과 시민 관심도만으로 정책의 시급성을 주장하는 논리적 비약
**위반 이유**: 연구의 학술적 권위와 시민 관심이 정책 시행의 충분한 근거가 되지 못하며, 실제 효과성이나 부작용에 대한 검토가 부족함
**개선 방안**: 연구 결과의 실제 적용 가능성, 정책 효과 예측, 비용편익 분석 등을 포함한 종합적 검토 필요` :
                        `**주장(결론)**: ${selectedTopic}에 대한 전면적인 정책을 즉시 시행해야 합니다.
**근거1**: 최근 한 연구에서 관련 지표가 개선되었다는 결과가 나왔습니다.
**근거1의 근거**: 이 연구는 국제적으로 인정받는 대학 연구진이 3년간 수행한 대규모 연구로서 신뢰성이 매우 높습니다.
**근거2**: 해외 선진국들이 이미 유사한 정책을 도입하고 있습니다.
**근거2의 근거**: 이는 글로벌 트렌드에 맞추기 위한 필수 조건이며, 경쟁력 확보를 위해서도 시급합니다.
**문제가 되는 부분**: 단일 연구의 규모와 해외 정책 도입 사실만으로 즉시 시행을 주장하는 성급한 결론
**위반 이유**: 연구의 규모가 크다고 해서 결과가 우리나라 상황에 적용 가능한 것은 아니며, 해외 정책의 성공 여부나 국내 적용 가능성에 대한 분석이 부족함
**개선 방안**: 국내 상황에 맞는 연구 결과, 해외 정책의 성과 분석, 단계적 도입 방안 등을 종합적으로 검토하여 신중한 정책 결정 필요`
                },
                {
                    text: difficulty === 'easy' ? 
                        `${selectedTopic} 문제를 해결해야 합니다. 첫째, 통계를 보면 이 문제가 심각한 지역일수록 경제 성장률이 낮습니다. 둘째, 이 문제로 인한 사회적 비용이 증가하고 있습니다. 따라서 경제 발전을 위해서라도 즉시 해결해야 합니다.` :
                        difficulty === 'normal' ?
                        `${selectedTopic} 문제를 시급히 해결해야 합니다. 첫 번째 근거로, 통계 분석 결과 이 문제가 심각한 지역일수록 경제 성장률이 현저히 낮습니다. 이는 10년간의 데이터를 분석한 결과로 신뢰성이 높습니다. 두 번째로, 기업들의 투자 기피 현상이 나타나고 있습니다. 따라서 우리나라의 지속적인 경제 발전을 위해서는 이 문제를 최우선적으로 해결해야 합니다.` :
                        `${selectedTopic} 문제를 전면적으로 해결해야 합니다. 첫 번째 근거로, 광범위한 통계 분석 결과 이 문제가 심각한 지역일수록 경제 성장률이 현저히 낮습니다. 이는 국가통계청의 20년간 데이터를 머신러닝으로 분석한 결과로 통계적 유의성이 99% 이상입니다. 두 번째 근거로, 외국인 투자자들이 관련 지역을 기피하고 있습니다. 이는 국제 투자 동향 보고서에서 확인된 바로, 글로벌 경쟁력 하락의 직접적 원인이 되고 있습니다. 따라서 ${selectedTopic} 문제 해결은 국가 경제의 생존과 직결된 핵심 과제입니다.`,
                    analysis: difficulty === 'easy' ?
                        `**주장(결론)**: ${selectedTopic} 문제를 해결해야 합니다.
**근거1**: 이 문제가 심각한 지역일수록 경제 성장률이 낮습니다.
**근거2**: 이 문제로 인한 사회적 비용이 증가하고 있습니다.
**문제가 되는 부분**: 상관관계를 인과관계로 해석하고 비용 증가를 구체적 수치 없이 주장
**위반 이유**: 지역별 차이가 이 문제 때문인지 다른 요인 때문인지 불분명하며, 사회적 비용의 정확한 측정값이 없음
**개선 방안**: 인과관계 입증을 위한 통제된 연구와 사회적 비용의 구체적 산정 필요` :
                        difficulty === 'normal' ?
                        `**주장(결론)**: ${selectedTopic} 문제를 시급히 해결해야 합니다.
**근거1**: 통계 분석 결과 이 문제가 심각한 지역일수록 경제 성장률이 현저히 낮습니다.
**근거1의 근거**: 이는 10년간의 데이터를 분석한 결과로 신뢰성이 높습니다.
**근거2**: 기업들의 투자 기피 현상이 나타나고 있습니다.
**문제가 되는 부분**: 장기 데이터의 상관관계를 인과관계로 단정하고 투자 기피의 원인을 단순화
**위반 이유**: 10년간의 상관관계가 인과관계를 보장하지 않으며, 투자 기피가 이 문제만의 원인인지 다른 경제적 요인들의 영향인지 구별하지 않음
**개선 방안**: 상관관계와 인과관계를 구분하고, 투자 기피의 복합적 원인 분석 필요` :
                        `**주장(결론)**: ${selectedTopic} 문제를 전면적으로 해결해야 합니다.
**근거1**: 광범위한 통계 분석 결과 이 문제가 심각한 지역일수록 경제 성장률이 현저히 낮습니다.
**근거1의 근거**: 이는 국가통계청의 20년간 데이터를 머신러닝으로 분석한 결과로 통계적 유의성이 99% 이상입니다.
**근거2**: 외국인 투자자들이 관련 지역을 기피하고 있습니다.
**근거2의 근거**: 이는 국제 투자 동향 보고서에서 확인된 바로, 글로벌 경쟁력 하락의 직접적 원인이 되고 있습니다.
**문제가 되는 부분**: 높은 통계적 유의성을 인과관계로 해석하고, 투자 기피와 경쟁력 하락을 단순 연결
**위반 이유**: 통계적 유의성이 높아도 상관관계일 뿐 인과관계는 아니며, 투자 기피와 경쟁력 하락 사이에도 다양한 중간 변수들이 존재할 수 있음
**개선 방안**: 실험적 설계나 자연실험을 통한 인과관계 입증, 투자 결정에 영향을 미치는 다양한 요인들의 종합적 분석 필요`
                },
                {
                    text: difficulty === 'easy' ? 
                        `${selectedTopic}은 매우 위험한 문제입니다. 첫째, 지난주 뉴스에서 관련 사고가 3건이나 보도되었습니다. 둘째, 전문가들이 우려를 표명하고 있습니다. 따라서 즉시 강력한 규제가 필요합니다.` :
                        difficulty === 'normal' ?
                        `${selectedTopic}은 우리 사회에 심각한 위협이 되고 있습니다. 첫 번째로, 최근 한 달간 언론에 보도된 관련 사건만 해도 10여 건에 달합니다. 이는 과거 6개월간 총 5건이었던 것과 비교하면 급격한 증가입니다. 두 번째로, 시민들의 불안감이 고조되고 있습니다. 따라서 정부는 즉시 강력한 규제 정책을 도입해야 합니다.` :
                        `${selectedTopic}은 우리 사회 전체의 안전을 위협하는 심각한 문제로 대두되고 있습니다. 첫 번째 근거로, 최근 몇 개월간 언론에 보도된 관련 사건들의 빈도가 급격히 증가했습니다. 특히 지난 한 달간에만 10여 건의 관련 사건이 언론에 보도되었으며, 이는 과거 동일 기간 대비 300% 증가한 수치로 매우 충격적입니다. 두 번째 근거로, 해외에서도 유사한 문제로 강력한 규제를 도입하고 있습니다. 이는 국제적 트렌드를 반영하는 것으로, 우리나라도 뒤처질 수 없는 상황입니다. 따라서 정부는 이 문제를 국가적 차원의 위기로 인식하고 즉시 전면적인 규제 정책을 시행해야 합니다.`,
                    analysis: difficulty === 'easy' ?
                        `**주장(결론)**: ${selectedTopic}에 대한 강력한 규제가 필요합니다.
**근거1**: 지난주 뉴스에서 관련 사고가 3건이나 보도되었습니다.
**근거2**: 전문가들이 우려를 표명하고 있습니다.
**문제가 되는 부분**: 일주일간 3건의 보도와 구체적이지 않은 전문가 의견으로 전체 판단
**위반 이유**: 극히 제한적인 기간과 사례로 전체 상황을 일반화하고, 전문가 의견의 구체적 내용이나 근거가 없음
**개선 방안**: 장기간 통계 데이터와 구체적인 전문가 분석 의견 필요` :
                        difficulty === 'normal' ?
                        `**주장(결론)**: ${selectedTopic}은 우리 사회에 심각한 위협이 되고 있습니다.
**근거1**: 최근 한 달간 언론에 보도된 관련 사건만 해도 10여 건에 달합니다.
**근거1의 근거**: 이는 과거 6개월간 총 5건이었던 것과 비교하면 급격한 증가입니다.
**근거2**: 시민들의 불안감이 고조되고 있습니다.
**문제가 되는 부분**: 언론 보도 건수의 증가를 실제 사건 증가로 해석하고 시민 불안감을 구체적 근거 없이 주장
**위반 이유**: 언론 보도량과 실제 발생률은 다를 수 있으며, 시민 불안감의 정확한 측정치나 원인 분석이 없음
**개선 방안**: 실제 발생률 통계와 시민 불안감에 대한 체계적 조사 결과 필요` :
                        `**주장(결론)**: ${selectedTopic}은 우리 사회 전체의 안전을 위협하는 심각한 문제입니다.
**근거1**: 최근 몇 개월간 언론에 보도된 관련 사건들의 빈도가 급격히 증가했습니다.
**근거1의 근거**: 지난 한 달간에만 10여 건이 보도되어 과거 동일 기간 대비 300% 증가했습니다.
**근거2**: 해외에서도 유사한 문제로 강력한 규제를 도입하고 있습니다.
**근거2의 근거**: 이는 국제적 트렌드를 반영하는 것으로, 우리나라도 뒤처질 수 없는 상황입니다.
**문제가 되는 부분**: 언론 보도 증가를 사회 전체 위험으로 확대 해석하고 해외 동향을 맹목적으로 따라야 한다고 주장
**위반 이유**: 언론 보도량이 실제 위험도를 정확히 반영한다고 볼 수 없으며, 해외 규제의 효과나 우리나라 상황과의 차이점을 고려하지 않음
**개선 방안**: 언론 보도와 실제 통계의 구별, 해외 사례의 구체적 성과 분석과 국내 적용 가능성 검토 필요`
                },
                {
                    text: difficulty === 'easy' ? 
                        `${selectedTopic} 정책을 추진해야 합니다. 첫째, 우리나라 축구 국가대표팀이 최근 국제 경기에서 좋은 성과를 거두고 있습니다. 둘째, 국민들의 자신감이 향상되었습니다. 따라서 이제 다른 분야에서도 적극적인 정책이 필요합니다.` :
                        difficulty === 'normal' ?
                        `${selectedTopic} 분야의 혁신적인 정책을 도입해야 합니다. 첫 번째로, 최근 우리나라는 K-팝과 K-드라마 등 한류 문화가 전 세계적으로 큰 인기를 끌고 있습니다. 이는 해외 수출액이 전년 대비 40% 증가한 구체적 성과로 입증됩니다. 두 번째로, 국가 브랜드 가치가 상승하고 있습니다. 따라서 ${selectedTopic} 분야에서도 과감하고 혁신적인 정책을 통해 세계 최고 수준을 달성해야 합니다.` :
                        `${selectedTopic} 분야에서 세계를 선도하는 혁신 정책을 즉시 시행해야 합니다. 첫 번째 근거로, 우리나라는 최근 K-팝, K-드라마, K-뷰티 등 한류 문화 전반에서 전 세계적인 성공을 거두고 있습니다. 특히 BTS의 빌보드 1위 달성과 넷플릭스에서의 오징어게임 흥행은 한국인의 창의성과 혁신 능력이 세계 최고 수준임을 증명하는 객관적 지표입니다. 두 번째 근거로, 이러한 성과로 인해 우리나라의 국가 신용등급이 상승했습니다. 국제 신용평가사들이 한국의 소프트파워 증대를 긍정적으로 평가하면서 경제 전망을 상향 조정했습니다. 따라서 이러한 문화적 성공 동력을 바탕으로 ${selectedTopic} 분야에서도 세계를 놀라게 할 혁신적인 정책을 추진해야 합니다.`,
                    analysis: difficulty === 'easy' ?
                        `**주장(결론)**: ${selectedTopic} 정책을 추진해야 합니다.
**근거1**: 우리나라 축구 국가대표팀이 최근 국제 경기에서 좋은 성과를 거두고 있습니다.
**근거2**: 국민들의 자신감이 향상되었습니다.
**문제가 되는 부분**: 축구 성과와 국민 자신감을 다른 분야 정책의 근거로 사용
**위반 이유**: 축구 성과와 해당 정책 분야 사이에 직접적 연관성이 없으며, 국민 자신감의 측정 방법이나 정책과의 관련성이 불분명함
**개선 방안**: 해당 정책 분야의 직접적인 현황과 필요성에 기반한 근거 제시 필요` :
                        difficulty === 'normal' ?
                        `**주장(결론)**: ${selectedTopic} 분야의 혁신적인 정책을 도입해야 합니다.
**근거1**: 최근 우리나라는 K-팝과 K-드라마 등 한류 문화가 전 세계적으로 큰 인기를 끌고 있습니다.
**근거1의 근거**: 이는 해외 수출액이 전년 대비 40% 증가한 구체적 성과로 입증됩니다.
**근거2**: 국가 브랜드 가치가 상승하고 있습니다.
**문제가 되는 부분**: 문화 콘텐츠 수출 성과와 브랜드 가치 상승을 다른 분야 정책의 근거로 활용
**위반 이유**: 문화 분야의 성공이 다른 정책 분야의 성공을 보장하지 않으며, 분야별 특성과 요구사항이 다름
**개선 방안**: 해당 정책 분야의 구체적인 현황, 문제점, 경쟁력 분석에 기반한 근거 필요` :
                        `**주장(결론)**: ${selectedTopic} 분야에서 세계를 선도하는 혁신 정책을 즉시 시행해야 합니다.
**근거1**: 우리나라는 K-팝, K-드라마, K-뷰티 등 한류 문화 전반에서 전 세계적인 성공을 거두고 있습니다.
**근거1의 근거**: BTS의 빌보드 1위 달성과 넷플릭스 오징어게임 흥행은 한국인의 창의성과 혁신 능력이 세계 최고 수준임을 증명합니다.
**근거2**: 이러한 성과로 인해 우리나라의 국가 신용등급이 상승했습니다.
**근거2의 근거**: 국제 신용평가사들이 한국의 소프트파워 증대를 긍정적으로 평가하면서 경제 전망을 상향 조정했습니다.
**문제가 되는 부분**: 문화적 성공과 신용등급 상승을 근거로 전혀 다른 분야의 정책 필요성을 주장
**위반 이유**: 문화 콘텐츠의 창의성과 다른 분야의 혁신 역량은 별개이며, 신용등급 상승이 모든 분야의 정책 성공을 보장하지 않음
**개선 방안**: 해당 정책 분야의 현재 수준, 해외 동향, 구체적 발전 방안 등 직접적 근거에 기반한 논증 필요`
                }
            ];
            
            const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
            return selectedPattern;
        })(),
        
        clarity: {
            text: difficulty === 'easy' ? 
                `${selectedTopic} 관련 정책이 필요합니다. 이것은 매우 중요한 문제이고, 그것을 해결해야 합니다. 따라서 우리는 지금 당장 이에 대한 대책을 마련해야 합니다. 이는 미래를 위해서도 꼭 필요한 일입니다.` :
                difficulty === 'normal' ?
                `${selectedTopic}에 대한 이것이 현재 우리가 직면한 핵심 이슈입니다. 그것에 대해 여러 연구에서 문제의 심각성이 지적되고 있으며, 이런 것들이 정부와 시민사회의 관심을 받고 있습니다. 하지만 그런 대응책은 충분하지 않은 상황입니다. 따라서 우리는 이것에 대해 보다 근본적인 접근이 필요합니다. 결국 그것에 대한 우리의 대응이 미래를 결정할 것입니다.` :
                `${selectedTopic}과 관련된 이것은 21세기 인류가 직면한 가장 복잡한 문제입니다. 그것은 단순히 하나의 영역에 국한되지 않고 다방면에 걸쳐 영향을 미치고 있습니다.\n\n현재 우리 사회는 이런 것에 대해 다양한 관점을 제시하고 있지만, 그런 것들에 대한 명확한 합의점을 찾지 못하고 있습니다. 일부는 그것을 강조하는 반면, 다른 이들은 이것이 우선되어야 한다고 주장합니다.\n\n하지만 무엇보다 중요한 것은 그런 것이 우리 모두의 삶과 직결되어 있다는 점입니다.`,
            analysis: difficulty === 'easy' ?
                `**주장(결론)**: ${selectedTopic} 관련 정책이 필요합니다.
**근거1**: 이것은 매우 중요한 문제입니다.
**근거2**: 그것을 해결해야 합니다.
**문제가 되는 부분**: "이것", "그것" 등의 지시어 남용으로 구체적 대상이 불분명
**위반 이유**: 무엇이 중요한 문제인지, 무엇을 해결해야 하는지 명확하지 않아 독자가 여러 의미로 해석할 수 있음
**개선 방안**: 지시어 대신 구체적인 명사를 사용하여 의미를 명확히 전달` :
                difficulty === 'normal' ?
                `**주장(결론)**: ${selectedTopic}에 대해 보다 근본적인 접근이 필요합니다.
**근거1**: 여러 연구에서 문제의 심각성이 지적되고 있습니다.
**근거1의 근거**: 정부와 시민사회의 관심을 받고 있습니다.
**근거2**: 현재 대응책은 충분하지 않은 상황입니다.
**문제가 되는 부분**: "이것", "그것", "이런 것들" 등 지시어의 과도한 사용으로 지시 대상 불분명
**위반 이유**: 지시어가 가리키는 구체적 대상이 명확하지 않아 문장의 의미를 여러 가지로 해석할 수 있음
**개선 방안**: 지시어를 구체적 명사로 대체하여 명확한 의미 전달` :
                `**주장(결론)**: ${selectedTopic}과 관련된 문제에 대한 명확한 합의점을 찾아야 합니다.
**근거1**: 현재 우리 사회는 다양한 관점을 제시하고 있지만 명확한 합의점을 찾지 못하고 있습니다.
**근거1의 근거**: 일부는 그것을 강조하는 반면, 다른 이들은 이것이 우선되어야 한다고 주장합니다.
**근거2**: 이런 것들이 우리 모두의 삶과 직결되어 있습니다.
**근거2의 근거**: 그것은 단순히 하나의 영역에 국한되지 않고 다방면에 걸쳐 영향을 미치고 있습니다.
**문제가 되는 부분**: "이것", "그것", "이런 것들" 등 지시어의 과도한 사용으로 지시 대상의 혼란
**위반 이유**: 복수의 지시어가 서로 다른 대상을 가리키는지 같은 대상을 가리키는지 불분명하여 독자에게 혼란 야기
**개선 방안**: 각 지시어를 구체적인 명사나 명사구로 대체하여 명확한 지시 관계 확립`
        },
        
        truth: {
            text: difficulty === 'easy' ? 
                `${selectedTopic}은 전 세계적으로 해결된 문제입니다. 대부분의 선진국에서 완전히 해결되었다는 보고가 있습니다. 따라서 우리나라도 이미 해결된 문제를 걱정할 필요가 없습니다. 이제는 다른 중요한 문제에 집중해야 할 시점입니다.` :
                difficulty === 'normal' ?
                `${selectedTopic}은 이미 전 세계적으로 해결된 문제입니다. 대부분의 선진국에서 완전히 해결되었다는 보고가 여러 기관에서 발표되었습니다. 특히 유럽과 북미 지역에서는 100% 해결되었다고 발표했습니다. 따라서 우리나라도 이런 성공 사례를 따라 쉽게 해결할 수 있을 것입니다. 결국 ${selectedTopic}은 더 이상 걱정할 필요가 없는 과거의 문제입니다.` :
                `${selectedTopic}은 이미 전 세계적으로 완전히 해결된 문제입니다. 대부분의 선진국에서 완전히 해결되었다는 공식 보고서가 발표되었습니다.\n\n특히 유럽연합, 미국, 일본 등 주요 선진국에서는 이 문제가 100% 해결되었다고 공식 발표했으며, 국제기구들도 이를 인정하고 있습니다. 이는 21세기 인류가 이룬 가장 큰 성과 중 하나로 평가받고 있습니다.\n\n따라서 우리나라도 이런 성공 사례를 참고하여 쉽게 해결할 수 있으며, ${selectedTopic}은 더 이상 우려할 필요가 없는 과거의 문제가 되었습니다.`,
            analysis: difficulty === 'easy' ?
                `**주장(결론)**: ${selectedTopic}은 전 세계적으로 해결된 문제입니다.
**근거1**: 대부분의 선진국에서 완전히 해결되었다는 보고가 있습니다.
**근거2**: 우리나라도 이미 해결된 문제를 걱정할 필요가 없습니다.
**문제가 되는 부분**: 사실과 다른 허위 정보 제시
**위반 이유**: 실제로는 여전히 전 세계적으로 해결되지 않은 문제임에도 해결되었다고 거짓 주장
**개선 방안**: 검증된 사실과 신뢰할 수 있는 통계 자료를 바탕으로 현실을 정확히 반영` :
                difficulty === 'normal' ?
                `**주장(결론)**: ${selectedTopic}은 이미 전 세계적으로 해결된 문제입니다.
**근거1**: 대부분의 선진국에서 완전히 해결되었다는 보고가 여러 기관에서 발표되었습니다.
**근거1의 근거**: 특히 유럽과 북미 지역에서는 100% 해결되었다고 발표했습니다.
**근거2**: 우리나라도 이런 성공 사례를 따라 쉽게 해결할 수 있을 것입니다.
**문제가 되는 부분**: 검증되지 않은 100% 해결 주장과 낙관적 전망
**위반 이유**: 실제 해결 여부에 대한 구체적 검증 없이 선진국 보고만으로 완전 해결을 단정하고, 국내 적용 가능성을 과도하게 낙관
**개선 방안**: 구체적 해결 사례와 효과 검증, 국내 상황과의 차이점 분석 필요` :
                `**주장(결론)**: ${selectedTopic}은 이미 전 세계적으로 완전히 해결된 문제입니다.
**근거1**: 대부분의 선진국에서 완전히 해결되었다는 공식 보고서가 발표되었습니다.
**근거1의 근거**: 유럽연합, 미국, 일본 등 주요 선진국에서는 이 문제가 100% 해결되었다고 공식 발표했습니다.
**근거2**: 국제기구들도 이를 인정하고 있습니다.
**근거2의 근거**: 이는 21세기 인류가 이룬 가장 큰 성과 중 하나로 평가받고 있습니다.
**문제가 되는 부분**: 현실과 맞지 않는 완전 해결 주장과 과장된 성과 평가
**위반 이유**: 실제로는 여전히 해결되지 않은 문제를 완전 해결되었다고 허위 주장하고, 국제기구의 구체적 평가 내용 없이 과장된 성과로 포장
**개선 방안**: 실제 해결 현황에 대한 정확한 데이터 제시와 국제기구의 구체적 평가 내용 확인 필요`
        }
    };
    
    const selectedData = dummyData[criteriaKey] || dummyData.support;
    
    return {
        text: selectedData.text,
        analysis: selectedData.analysis
    };
}

// Claude API 호출 함수
async function generateClaudePrompt(criteria, difficulty) {
    let attempts = 0;
    const maxAttempts = 5;
    const topic = getRandomTopic();

    while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n=== Claude 제시문 생성 시도 ${attempts}/${maxAttempts} ===`);
        try {
            console.log(`🔥 일관된 주제: ${topic}`);
            const evaluations = [];

            for (const criterion of criteria) {
                console.log(`\n--- "${criterion}" 지침에 대한 구조 설계 시작 ---`);
                const structurePrompt = buildClaudeArgumentStructurePrompt(topic, [criterion], difficulty);
                const structureMsg = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307", // 또는 다른 Claude 모델
                    max_tokens: 1024,
                    messages: [{ role: "user", content: structurePrompt }],
                });
                const structureText = structureMsg.content[0].text;
                
                const parsedStructure = parseClaudeAnalysis(structureText);
                console.log(`📝 "${criterion}" Claude 원문:`, structureText);
                console.log(`🔍 "${criterion}" 파싱 결과:`, {
                    claim: !!parsedStructure.claim,
                    reason: !!parsedStructure.reason,
                    problematicPart: !!parsedStructure.problematicPart,
                    violationReason: !!parsedStructure.violationReason
                });
                
                if (!parsedStructure.claim || !parsedStructure.reason) {
                    console.warn(`[경고] "${criterion}" Claude 구조 파싱 실패. 다음 지침으로 넘어갑니다.`);
                    console.warn('파싱 실패 원인:', {
                        claim: parsedStructure.claim || 'MISSING',
                        reason: parsedStructure.reason || 'MISSING'
                    });
                    continue;
                }
                
                evaluations.push({
                    criteria: criterion,
                    claim: parsedStructure.claim,
                    reason: parsedStructure.reason,
                    problematicPart: parsedStructure.problematicPart,
                    violationReason: parsedStructure.violationReason,
                    improvementSuggestion: parsedStructure.improvementSuggestion
                });
                console.log(`--- "${criterion}" 지침에 대한 구조 설계 완료 ---`);
            }

            if (evaluations.length === 0) {
                throw new Error("모든 지침에 대한 논증 구조 생성에 실패했습니다.");
            }
            
            console.log(`📊 생성된 evaluations 개수: ${evaluations.length}`);
            console.log(`📊 evaluations 내용:`, evaluations.map(e => ({
                criteria: e.criteria,
                hasProblematicPart: !!e.problematicPart,
                hasViolationReason: !!e.violationReason
            })));
            
            const representativeClaim = evaluations[0].claim;
            const representativeReasons = evaluations.map(e => e.reason).join(" ");

            const textPrompt = buildClaudeTextPrompt(topic, criteria, difficulty, {
                claim: representativeClaim,
                reason: representativeReasons,
                evaluations: evaluations
            });

            const textMsg = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 1024,
                messages: [{ role: "user", content: textPrompt }],
            });
            const generatedText = cleanPromptText(textMsg.content[0].text.trim());

            if (generatedPrompts.has(generatedText)) {
                console.log('이미 생성된 제시문입니다. 재시도합니다.');
                continue;
            }
            generatedPrompts.add(generatedText);

            const finalAnalysis = {
                claim: representativeClaim,
                reason: representativeReasons,
                evaluations: evaluations.map(e => ({
                    criteria: e.criteria,
                    problematicPart: e.problematicPart,
                    violationReason: e.violationReason,
                    improvementSuggestion: e.improvementSuggestion
                }))
            };

            console.log(`✅ Claude 제시문 생성 완료! (시도 ${attempts}/${maxAttempts})`);
            return { prompt: generatedText, analysis: finalAnalysis };

        } catch (error) {
            console.error(`Claude API 오류 (시도 ${attempts}):`, error);
            if (attempts >= maxAttempts) {
                console.log('🎯 최대 재시도 횟수 초과로 더미 데이터를 사용합니다.');
                return generateDummyPrompt(criteria, difficulty); // fallback
            }
        }
    }
}

// API 라우트들

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 제시문 생성 API (Claude 연동)
app.post('/api/generate-prompt', async (req, res) => {
    const { criteria, difficulty } = req.body;
    
    if (!process.env.CLAUDE_API_KEY) {
        return res.status(500).json({ error: 'Anthropic API 키가 설정되지 않았습니다.' });
    }
    
    try {
        const result = await generateClaudePrompt(criteria, difficulty);
        res.json({ prompt: result.prompt, analysis: result.analysis });
    } catch (error) {
        console.error('제시문 생성 오류:', error);
        res.status(500).json({ error: 'Claude API 호출 중 오류가 발생했습니다.' });
    }
});

// 평가 제출 API (더미)
app.post('/api/submit-evaluation', (req, res) => {
    const { evaluation, prompt, criteria, difficulty } = req.body;
    if (!evaluation || evaluation.trim().length < 10) {
        return res.status(400).json({
            success: false,
            message: '평가 내용을 충분히 작성해주세요.'
        });
    }
    
    const feedback = {
        score: Math.floor(Math.random() * 30) + 70,
        strengths: [
            '논리적 구조가 명확합니다.',
            '구체적인 근거를 잘 제시했습니다.'
        ],
        improvements: [
            '반박에 대한 대응 논리를 더 보강해보세요.',
            '결론 부분을 더 명확하게 정리해보세요.'
        ],
        detailedFeedback: '전반적으로 논리적 사고가 잘 드러나는 평가입니다. 특히 근거 제시 부분이 우수합니다.'
    };
    
    res.json({
        success: true,
        data: {
            submissionId: Date.now().toString(),
            feedback: feedback,
            timestamp: new Date().toISOString()
        }
    });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
    });
});

// 404 핸들링
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '요청하신 페이지를 찾을 수 없습니다.'
    });
});

// 생성된 제시문 추적 (기존과 동일)
let generatedPrompts = new Set();

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

// Claude 응답 파싱 함수
function parseClaudeAnalysis(text) {
    const getText = (tag) => {
        const match = text.match(new RegExp(`<item>${tag}:(.*?)</item>`, 's'));
        return match ? match[1].trim() : '';
    };

    return {
        claim: getText('주장\\(결론\\)'),
        reason: getText('근거\\(이유\\)'),
        problematicPart: getText('문제가 되는 부분'),
        violationReason: getText('위반 이유'),
        improvementSuggestion: getText('개선 방안')
    };
}
