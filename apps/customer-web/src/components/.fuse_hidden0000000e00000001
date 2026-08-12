import { useEffect, useState } from "react";

const SplashScreen = ({ onDone }: { onDone?: () => void }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), 2200);
    const b = setTimeout(() => onDone?.(), 2700);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [onDone]);

  return (
    <div className={`zm-splash${leaving ? " zm-leave" : ""}`}>
      <style>{`
        .zm-splash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:radial-gradient(circle at 50% 42%,#fff 0%,#f1fbf4 55%,#e6f5ec 100%);transition:opacity .5s ease,visibility .5s}
        .zm-leave{opacity:0;visibility:hidden}
        .zm-stage{display:flex;flex-direction:column;align-items:center;gap:20px}
        .zm-mark{position:relative;width:112px;height:112px;display:grid;place-items:center}
        .zm-ring{position:absolute;inset:0;border-radius:28px;border:3px solid #2fab5c;opacity:0;animation:zmRing .9s ease-out .1s forwards}
        .zm-tile{position:relative;width:112px;height:112px;border-radius:28px;overflow:hidden;background:linear-gradient(135deg,#2fab5c,#1d6f3d);box-shadow:0 18px 40px -14px rgba(33,140,74,.6);display:grid;place-items:center;opacity:0;transform:scale(.3);animation:zmTile .6s cubic-bezier(.2,.8,.2,1) forwards}
        .zm-tile svg{width:58px;height:58px}
        .zm-bolt{fill:#fff;transform-origin:50% 50%;transform:scale(0);animation:zmBolt .5s cubic-bezier(.2,.9,.2,1) .25s forwards}
        .zm-shine{position:absolute;top:0;left:0;width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-160%) skewX(-18deg);animation:zmShine .9s ease-in-out .15s forwards}
        .zm-word{font-family:Inter,system-ui,sans-serif;font-weight:800;font-size:48px;letter-spacing:-.02em;opacity:0;transform:translateY(24px);animation:zmUp .55s cubic-bezier(.2,.8,.2,1) .45s forwards}
        .zm-zip{color:#218c4a}.zm-mart{color:#111827}.zm-zap{color:#2fab5c}
        .zm-tag{font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:600;color:#6b7280;opacity:0;transform:translateY(14px);animation:zmUp .5s ease-out .75s forwards;margin:0}
        .zm-bar{width:180px;height:4px;border-radius:99px;background:#def7e5;overflow:hidden;opacity:0;animation:zmFade .4s ease-out .8s forwards}
        .zm-bar>i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#2fab5c,#218c4a);animation:zmFill 1.3s ease-in-out .9s forwards}
        @keyframes zmTile{0%{opacity:0;transform:scale(.3) translateY(-24px) rotate(-8deg)}70%{opacity:1;transform:scale(1.08) rotate(0)}100%{opacity:1;transform:scale(1)}}
        @keyframes zmBolt{0%{transform:scale(0)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
        @keyframes zmRing{0%{opacity:0;transform:scale(.6)}40%{opacity:.55}100%{opacity:0;transform:scale(1.8)}}
        @keyframes zmShine{0%{transform:translateX(-160%) skewX(-18deg)}100%{transform:translateX(320%) skewX(-18deg)}}
        @keyframes zmUp{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes zmFade{to{opacity:1}}
        @keyframes zmFill{0%{width:0}100%{width:100%}}
        @media (prefers-reduced-motion:reduce){.zm-splash *{animation-duration:.01ms!important}}
      `}</style>

      <div className="zm-stage">
        <div className="zm-mark">
          <span className="zm-ring" />
          <div className="zm-tile">
            <span className="zm-shine" />
            <svg viewBox="0 0 64 64"><path className="zm-bolt" d="M36 8 L18 36 h10 L28 56 L46 26 h-10 z" /></svg>
          </div>
        </div>
        <div className="zm-word"><span className="zm-zip">Zip</span><span className="zm-mart">Mart</span><span className="zm-zap">⚡</span></div>
        <p className="zm-tag">Groceries delivered in minutes</p>
        <div className="zm-bar"><i /></div>
      </div>
    </div>
  );
};

export default SplashScreen;
