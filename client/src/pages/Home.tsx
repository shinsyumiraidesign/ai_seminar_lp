import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Clock, MapPin, Users, Zap, ArrowRight, Star, Calendar, ShieldCheck, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date("2025-01-24T10:00:00");
    
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      {/* Header/Nav */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="font-heading font-bold text-xl tracking-tighter text-gradient">
            信州ミライデザインLAB.
          </div>
          <Button 
            onClick={() => scrollToSection("cta")}
            className="bg-brand-yellow hover:bg-yellow-400 text-slate-900 font-bold rounded-full shadow-md transition-all hover:scale-105"
          >
            席を確保する
          </Button>
        </div>
      </header>

      <main className="flex-grow pt-16">
        {/* Section 1: Hero */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-50">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 z-0 opacity-10">
            <img 
              src="/images/hero_bg.jpg" 
              alt="Background" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Decorative Blobs */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-brand-pink/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-brand-blue/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="container relative z-10 mx-auto px-4 py-12 text-center">
            <div className="inline-block mb-6 px-4 py-1 bg-white/80 backdrop-blur rounded-full border border-brand-pink/30 text-brand-pink font-bold text-sm shadow-sm animate-bounce">
              ＼ 2025年1月24日(土) 開催 ／
            </div>
            
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
              ChatGPTを<br className="md:hidden" />
              <span className="text-gradient">「使ってるつもり」</span><br className="md:hidden" />
              から卒業する<br />
              <span className="relative inline-block mt-2">
                2.5時間
                <span className="absolute bottom-1 left-0 w-full h-3 bg-brand-yellow/50 -z-10 transform -rotate-1"></span>
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto font-medium">
              あなた専用のAI秘書を作って持ち帰る実践ワークショップ<br />
              <span className="text-sm md:text-base text-slate-500 mt-2 block">
                〜 Dify・Make等の最新自動化ツールも体験 〜
              </span>
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-10 text-slate-700">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                <Calendar className="w-5 h-5 text-brand-blue" />
                <span className="font-bold">1月24日(土) 10:00-12:30</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                <MapPin className="w-5 h-5 text-brand-pink" />
                <span className="font-bold">上田リサーチパーク</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button 
                onClick={() => scrollToSection("cta")}
                size="lg" 
                className="bg-gradient-brand hover:opacity-90 text-white font-bold text-xl px-12 py-8 rounded-full shadow-xl transition-transform hover:scale-105 w-full md:w-auto"
              >
                今すぐ席を確保する
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
              <p className="text-brand-pink font-bold text-sm">
                ＼ 30名限定・残席わずか ／
              </p>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" /> 駐車場無料
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" /> 個別サポート付き
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" /> 成果物保証
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Problem */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                  8割の人がChatGPTの能力の<br />
                  <span className="text-red-500 text-5xl">5%</span>しか使えていない<br />
                  衝撃の事実
                </h2>
                <div className="w-24 h-1 bg-slate-200 mx-auto rounded-full"></div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="relative">
                  <img 
                    src="/images/problem_illustration.png" 
                    alt="Problem Illustration" 
                    className="w-full max-w-md mx-auto drop-shadow-2xl rounded-2xl"
                  />
                </div>
                <div className="space-y-4">
                  {[
                    "ChatGPTで天気やレシピを調べるだけになっている",
                    "プロンプトを書いても、期待した答えが返ってこない",
                    "同僚は「AIで効率化した」と言うが、自分は実感できない",
                    "「Dify」「Make」という言葉は聞くが、何ができるか分からない",
                    "YouTubeや本で勉強したが、実務への応用方法が見えない",
                    "このままだと取り残される不安がある"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-pink/30 transition-colors">
                      <div className="mt-1 min-w-[20px] h-5 rounded border-2 border-slate-300 flex items-center justify-center">
                        <div className="w-3 h-3 bg-transparent"></div>
                      </div>
                      <p className="font-medium text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-16 text-center bg-slate-900 text-white p-8 rounded-2xl shadow-xl">
                <p className="text-lg md:text-xl font-bold mb-2">もし3つ以上当てはまるなら...</p>
                <p className="text-2xl md:text-3xl font-heading text-brand-yellow">
                  あなたは「AIを使えているフリ」を<br className="md:hidden" />しているだけかもしれません
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Solution */}
        <section className="py-20 bg-slate-50 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
                たった2.5時間で、<br />
                月曜日からの仕事が激変する
              </h2>
              <p className="text-slate-600">本セミナーが約束する3つの価値</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Promise 1 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                <div className="h-2 bg-brand-pink w-full"></div>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto bg-brand-pink/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="w-8 h-8 text-brand-pink" />
                  </div>
                  <CardTitle className="text-xl font-bold">明日から使える<br />「自分専用AI」</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  <p className="mb-4">
                    あなたの実際の業務（メール、報告書、企画書）にカスタマイズしたAIツールをその場で作成。
                  </p>
                  <div className="bg-slate-100 py-2 px-4 rounded-full text-sm font-bold text-slate-800 inline-block">
                    完成品を持ち帰れます
                  </div>
                </CardContent>
              </Card>

              {/* Promise 2 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                <div className="h-2 bg-brand-blue w-full"></div>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto bg-brand-blue/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-brand-blue" />
                  </div>
                  <CardTitle className="text-xl font-bold">つまずいても安心の<br />個別フォロー</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  <p className="mb-4">
                    講師が各席を巡回し、あなたの疑問に直接回答。「うちの業界では？」もその場で解決。
                  </p>
                  <div className="bg-slate-100 py-2 px-4 rounded-full text-sm font-bold text-slate-800 inline-block">
                    その場で解決策を提示
                  </div>
                </CardContent>
              </Card>

              {/* Promise 3 */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
                <div className="h-2 bg-brand-yellow w-full"></div>
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 mx-auto bg-brand-yellow/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                  <CardTitle className="text-xl font-bold">最新ツールで<br />差をつける</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  <p className="mb-4">
                    ChatGPTの次のステージ「Dify」「Make」の実践デモと活用事例を特別公開。
                  </p>
                  <div className="bg-slate-100 py-2 px-4 rounded-full text-sm font-bold text-slate-800 inline-block">
                    1年後の未来が見えます
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 4: Before/After */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                セミナー参加後の月曜日、<br />
                あなたのデスクでは...
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Before */}
              <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-slate-300 text-slate-600 font-bold px-6 py-2 rounded-br-xl">
                  Before：今まで
                </div>
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="text-2xl">😓</span>
                    <span className="text-lg font-medium line-through decoration-slate-400">メール返信に30分</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="text-2xl">😓</span>
                    <span className="text-lg font-medium line-through decoration-slate-400">議事録作成に1時間</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="text-2xl">😓</span>
                    <span className="text-lg font-medium line-through decoration-slate-400">企画書の下書きに2時間</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <span className="text-2xl">😓</span>
                    <span className="text-lg font-medium line-through decoration-slate-400">定型業務で1日が終わる</span>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="bg-gradient-to-br from-brand-pink/10 to-brand-blue/10 rounded-2xl p-8 border border-brand-blue/20 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 bg-gradient-brand text-white font-bold px-6 py-2 rounded-br-xl shadow-md">
                  After：セミナー後
                </div>
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-4 text-slate-800">
                    <span className="text-2xl">😊</span>
                    <span className="text-lg font-bold">メール返信が3分で完了</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-800">
                    <span className="text-2xl">😊</span>
                    <span className="text-lg font-bold">議事録が自動で要約される</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-800">
                    <span className="text-2xl">😊</span>
                    <span className="text-lg font-bold">企画書の叩き台が5分で完成</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-800">
                    <span className="text-2xl">😊</span>
                    <span className="text-lg font-bold">創造的な仕事に集中できる</span>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-20">
                  <img src="/images/ai_assistant_icon.png" alt="AI Icon" className="w-32 h-32" />
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex flex-col md:flex-row gap-8 bg-white p-6 rounded-xl shadow-md border border-slate-100">
                <div className="text-center px-8 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0">
                  <p className="text-sm text-slate-500 font-bold mb-1">削減できる時間</p>
                  <p className="text-3xl font-heading font-extrabold text-brand-blue">週10時間以上</p>
                </div>
                <div className="text-center px-8">
                  <p className="text-sm text-slate-500 font-bold mb-1">生産性向上</p>
                  <p className="text-3xl font-heading font-extrabold text-brand-pink">2.5倍</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Curriculum */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                カリキュラム詳細
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              {/* Item 1 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-brand-blue rounded-full mt-2"></div>
                  <div className="w-0.5 flex-grow bg-slate-200 my-2"></div>
                </div>
                <div className="flex-grow pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">10:00-10:45</span>
                    <h3 className="text-xl font-bold">【講義】AIの黄金法則</h3>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">・</span>
                        なぜあなたのAI活用は失敗するのか
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">・</span>
                        プロンプトエンジニアリングの基礎
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">・</span>
                        ChatGPT/Dify/Makeの使い分け
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-brand-pink rounded-full mt-2"></div>
                  <div className="w-0.5 flex-grow bg-slate-200 my-2"></div>
                </div>
                <div className="flex-grow pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">10:45-12:15</span>
                    <h3 className="text-xl font-bold">【実践】AI秘書構築</h3>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-brand-pink">
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">・</span>
                        自分の業務を分析
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">・</span>
                        カスタムプロンプト作成
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">・</span>
                        GPTs or Difyで自動化
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-pink font-bold">・</span>
                        講師による個別アドバイス
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex gap-4 md:gap-8">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-brand-yellow rounded-full mt-2"></div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">12:15-12:30</span>
                    <h3 className="text-xl font-bold">【交流】</h3>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-slate-600">質疑応答・ネットワーキング</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Instructor */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-slate-50 rounded-3xl p-8 md:p-12 shadow-inner">
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-slate-200">
                    {/* Placeholder for instructor image */}
                    <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500">
                      講師写真
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <h2 className="text-sm font-bold text-brand-blue mb-2">講師紹介</h2>
                  <h3 className="text-3xl font-heading font-bold mb-2">森角 太一</h3>
                  <p className="text-slate-600 font-medium mb-6">
                    信州ミライデザインLAB. 代表 / 元教員AIコンサルタント
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500">指導実績</p>
                      <p className="font-bold text-lg">4,000人以上</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500">AI導入支援</p>
                      <p className="font-bold text-lg">県内企業15社</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500">最大プロジェクト</p>
                      <p className="font-bold text-lg">40万円案件</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-slate-500">セミナー満足度</p>
                      <p className="font-bold text-lg">98%</p>
                    </div>
                  </div>

                  <div className="relative bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="absolute -top-3 -left-2 text-4xl text-brand-pink opacity-30">"</div>
                    <p className="text-slate-700 italic relative z-10">
                      元数学教師の私だからこそ、難しいことを分かりやすく伝えられます。一緒にAIで仕事を楽しくしましょう！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Testimonials */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                参加者の声
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  role: "40代・製造業・Kさん",
                  text: "独学では絶対に気づけなかった活用法を教えてもらえた"
                },
                {
                  role: "30代・営業職・Mさん",
                  text: "作ったツールで翌週の仕事が3時間短縮できました"
                },
                {
                  role: "50代・経営者・Tさん",
                  text: "Difyの可能性に驚いた。投資対効果が見えた"
                }
              ].map((item, index) => (
                <Card key={index} className="bg-slate-800 border-slate-700 text-slate-200">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-lg font-medium mb-4">"{item.text}"</p>
                    <p className="text-sm text-slate-400 font-bold text-right">- {item.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section 8: Event Details */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                開催概要
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              <div>
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 font-bold text-slate-500 w-24">日時</th>
                      <td className="py-4 font-medium">2025年1月24日(土) 10:00-12:30</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 font-bold text-slate-500">会場</th>
                      <td className="py-4 font-medium">+519worklodge（上田リサーチパーク内）</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 font-bold text-slate-500">住所</th>
                      <td className="py-4 font-medium">長野県上田市下之郷812-10</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 font-bold text-slate-500">定員</th>
                      <td className="py-4 font-medium">30名限定（先着順）</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 font-bold text-slate-500">参加費</th>
                      <td className="py-4 font-bold text-xl text-brand-blue">3,500円（税込）</td>
                    </tr>
                    <tr>
                      <th className="py-4 font-bold text-slate-500">持ち物</th>
                      <td className="py-4 font-medium text-red-500 font-bold">ノートPC必須</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="h-full min-h-[300px] bg-slate-100 rounded-xl overflow-hidden relative">
                {/* Map Placeholder */}
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3205.678912345678!2d138.2345678!3d36.3456789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzY!5e0!3m2!1sja!2sjp!4v1610000000000!5m2!1sja!2sjp" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  className="absolute inset-0 w-full h-full"
                ></iframe>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-bold">無料駐車場40台完備！</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>上田駅から車で10分</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 9: Urgency & CTA */}
        <section id="cta" className="py-20 bg-gradient-brand text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/hero_bg.jpg')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="mb-12">
              <p className="text-xl font-bold mb-4 opacity-90">セミナー開始まで</p>
              <div className="flex justify-center gap-4 md:gap-8">
                <div className="bg-white/20 backdrop-blur rounded-xl p-4 min-w-[80px]">
                  <div className="text-4xl md:text-5xl font-heading font-bold">{timeLeft.days}</div>
                  <div className="text-xs uppercase tracking-wider mt-1">Days</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-4 min-w-[80px]">
                  <div className="text-4xl md:text-5xl font-heading font-bold">{timeLeft.hours}</div>
                  <div className="text-xs uppercase tracking-wider mt-1">Hours</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl p-4 min-w-[80px]">
                  <div className="text-4xl md:text-5xl font-heading font-bold">{timeLeft.minutes}</div>
                  <div className="text-xs uppercase tracking-wider mt-1">Minutes</div>
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-900 max-w-4xl mx-auto rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-100 pb-8">
                <div className="text-left">
                  <p className="text-slate-500 font-bold mb-1">現在の状況</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    残席：<span className="text-red-500 text-4xl font-heading">△△</span> / 30名
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-left md:text-right">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-1">
                    <ShieldCheck className="w-4 h-4 text-green-500" /> 前回開催は3日で満席
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <Clock className="w-4 h-4 text-orange-500" /> 次回開催は未定
                  </div>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                3,500円 = コーヒー10杯分の投資で<br />
                <span className="text-brand-blue">残りの人生の働き方</span>が変わります
              </h2>

              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto bg-brand-yellow hover:bg-yellow-400 text-slate-900 font-bold text-xl px-16 py-8 rounded-full shadow-xl transition-transform hover:scale-105"
                  onClick={() => window.open("https://peatix.com", "_blank")}
                >
                  Peatixで席を確保する
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
                <p className="text-xs text-slate-400">
                  ※外部サイト（Peatix）へ移動します
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 10: FAQ */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                よくある質問
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="bg-white border border-slate-200 rounded-xl px-4">
                  <AccordionTrigger className="font-bold text-lg hover:no-underline">
                    Q. プログラミング知識は必要ですか？
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-4">
                    A. 一切不要です。マウス操作ができれば大丈夫です。専門用語も極力使わずに解説します。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="bg-white border border-slate-200 rounded-xl px-4">
                  <AccordionTrigger className="font-bold text-lg hover:no-underline">
                    Q. ChatGPTの有料版は必要ですか？
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-4">
                    A. 無料版で十分です。有料版をお持ちの方はより高度な機能も体験いただけますが、必須ではありません。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="bg-white border border-slate-200 rounded-xl px-4">
                  <AccordionTrigger className="font-bold text-lg hover:no-underline">
                    Q. どんな業種でも対応できますか？
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-4">
                    A. はい。事務、営業、企画、経営など、あらゆる職種での活用事例をご用意しています。個別サポートで業界特有の課題も解決します。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="bg-white border border-slate-200 rounded-xl px-4">
                  <AccordionTrigger className="font-bold text-lg hover:no-underline">
                    Q. PCを持っていない場合は？
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 pb-4">
                    A. スマホ参加も可能ですが、実際のツール作成を行うため、効果が限定的になります。可能な限りPCのご持参をお勧めします。
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Section 11: Final Message */}
        <section className="py-20 bg-white text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">まだ迷っていますか？</h2>
            
            <div className="max-w-2xl mx-auto text-lg text-slate-600 mb-12 space-y-6">
              <p>
                月曜日の朝、同僚が10分で終わらせる仕事に<br />
                あなたは1時間かけ続けますか？
              </p>
              <p className="font-bold text-slate-900 text-xl">
                それとも、2.5時間の投資で<br />
                残業から解放される未来を選びますか？
              </p>
            </div>

            <Button 
              onClick={() => scrollToSection("cta")}
              size="lg" 
              className="bg-gradient-brand hover:opacity-90 text-white font-bold text-xl px-12 py-8 rounded-full shadow-xl transition-transform hover:scale-105"
            >
              今すぐ申し込む
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>

            <div className="mt-12 bg-slate-50 inline-block p-6 rounded-xl border border-slate-200 max-w-lg">
              <p className="font-bold text-brand-pink mb-2">PS.</p>
              <p className="text-sm text-slate-600">
                地域貢献価格での開催は今回限り。<br />
                通常のコンサル料金（1時間15,000円）の1/4以下で受講できるチャンスです。
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-sm">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="font-heading font-bold text-xl text-white mb-4">
            信州ミライデザインLAB.
          </div>
          <p>協力：Core AI Academy</p>
          <p>お問い合わせ：shinsyu.mirai.design@gmail.com / 090-1828-7103</p>
          <div className="pt-8 border-t border-slate-800 mt-8">
            &copy; 2025 Shinshu Mirai Design LAB. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
