import { ArrowDownToLine, ArrowUpRight, Heart, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

const mapUrl = 'https://yandex.ru/maps/?text=' + encodeURIComponent('SOMA Москва Петровский бульвар 14');

export default function Home() {
  return (
    <div className="invitation">
      <a className="skip-link" href="#invitation">Перейти к приглашению</a>
      <header className="masthead">
        <a href="#invitation" className="dedication" aria-label="Для моей любимой — приглашение">
          <Heart size={19} strokeWidth={1.4} aria-hidden="true" />
          <span>для моей любимой</span>
        </a>
        <span className="edition">ОСОБЕННЫЙ ВЕЧЕР · 13.09</span>
      </header>

      <main id="invitation">
        <section className="hero" aria-labelledby="invitation-title">
          <div className="hero-copy">
            <p className="eyebrow"><span /> У МЕНЯ ДЛЯ ТЕБЯ ПРИГЛАШЕНИЕ</p>
            <h1 id="invitation-title">Вечер для<br /><em>нас двоих.</em></h1>
            <p className="intro">Любимая, давай отложим все дела.<br className="desktop-break" /> Красивое место, вкусный ужин и ты напротив.<br className="desktop-break" /> Мне кажется, это идеальный план.</p>
            <div className="date-line" aria-label="13 сентября 2026 года, воскресенье, в 18:00 по московскому времени">
              <div className="date-number" aria-hidden="true">13</div>
              <div className="date-month" aria-hidden="true"><span>сентября</span><span>воскресенье</span></div>
              <span className="date-divider" aria-hidden="true" />
              <time dateTime="2026-09-13T18:00:00+03:00">18:00<span>время для нас</span></time>
            </div>
            <a className={buttonVariants({ size: 'lg' }) + ' calendar-button'} href="/date-with-you.ics" download="Вечер-в-SOMA.ics">
              Сохранить этот вечер <ArrowDownToLine size={17} strokeWidth={1.5} aria-hidden="true" />
            </a>
            <p className="button-note">маленькое напоминание о чём-то прекрасном</p>
          </div>
          <div className="hero-art">
            <div className="photo-backdrop" aria-hidden="true" />
            <figure className="photograph">
              <img src="/evening-still-life.webp" width="1122" height="1402" fetchPriority="high" alt="Два бокала, бордовая калла и тёплый свет свечи на льняной скатерти" />
              <figcaption>счастье — это время с тобой</figcaption>
            </figure>
            <div className="love-seal" aria-hidden="true"><Heart size={29} strokeWidth={1.1} /><span>ты + я</span></div>
            <span className="art-note" aria-hidden="true">a little rendez-vous</span>
          </div>
        </section>
        <section className="venue" aria-labelledby="venue-title">
          <div className="venue-name"><span className="eyebrow">МЕСТО НАШЕЙ ВСТРЕЧИ</span><h2 id="venue-title">soma<span>ресторан</span></h2></div>
          <div className="venue-address"><MapPin size={19} strokeWidth={1.4} aria-hidden="true" /><div><p>Петровский бульвар, 14</p><span>Москва · вход через арку</span></div></div>
          <a className="map-link" href={mapUrl} target="_blank" rel="noopener noreferrer">Посмотреть на карте<ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /><span className="sr-only"> — откроется в новой вкладке</span></a>
        </section>
      </main>
      <footer className="footer"><p>Самое красивое в этом вечере — ты.</p><Heart size={14} strokeWidth={1.5} aria-label="С любовью" /></footer>
    </div>
  );
}

