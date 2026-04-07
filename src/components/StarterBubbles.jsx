export default function StarterBubbles({ onSelect, isVisible }) {
  if (!isVisible) return null;

  const bubbles = [
    { id: 1, text: "How do I apply for sick leave?", zh: "如何申請病假？" },
    { id: 2, text: "What is the winter uniform policy?", zh: "冬季校服規定是什麼？" },
    { id: 3, text: "I need to talk about my child's behavior.", zh: "我想討論我孩子的行為問題。" }
  ];

  return (
    <div className="flex flex-col gap-2 mt-4 max-w-md mx-auto w-full px-4">
      {bubbles.map(bubble => (
        <button
          key={bubble.id}
          onClick={() => onSelect(bubble.text)}
          className="text-left w-full glass bg-white/50 hover:bg-white/80 active:bg-sage-100 px-4 py-3 rounded-xl text-warmgrey-800 text-sm font-medium transition-all shadow-sm border border-sage-200"
        >
          <div className="flex flex-col">
            <span>{bubble.text}</span>
            <span className="text-xs text-warmgrey-500 font-normal">{bubble.zh}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
