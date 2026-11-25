(function(){
  "use strict";

  /* ---------- Theme: all 41 CTPVerse Dashboard themes ---------- */
  var themeSelect = document.getElementById('themeSelect');
  themeSelect.addEventListener('change', function(){
    document.documentElement.setAttribute('data-theme', themeSelect.value);
  });

  /* ---------- Width: Nuke / Full toggle button, left of the theme picker —
     the same control as the CTPVerse Dashboard: the button shows the
     current width and a click switches to the other one. The choice is
     remembered in localStorage, just like the theme, so it survives
     page reloads ---------- */
  var widthBtn = document.getElementById('widthToggle');
  var WIDTH_KEY = 'ctp-music-portal-width';
  function applyWidth(mode){
    document.documentElement.setAttribute('data-width', mode);
    widthBtn.textContent = mode === 'full' ? 'WIDTH: Full' : 'WIDTH: Nuke';
  }
  function setWidth(mode){
    applyWidth(mode);
    try{ localStorage.setItem(WIDTH_KEY, mode); }catch(e){}
  }
  try{
    var savedWidth = localStorage.getItem(WIDTH_KEY);
    if(savedWidth === 'full' || savedWidth === 'nuke'){ applyWidth(savedWidth); }
  }catch(e){}
  widthBtn.addEventListener('click', function(){
    setWidth(document.documentElement.getAttribute('data-width') === 'full' ? 'nuke' : 'full');
  });

  /* ---------- Internal channel data ----------
     One internal data source drives the left menu, the Radio Wall and
     the player. It is not displayed on the page. */
  var DIRECTORY = {
    network: "CTP Music",
    description: "Techno-spiritual underground & Conscious Translational Physics audio network",
    channels: [
      { id:"ctp-01", name:"Psytrancelicious", genre:"Psytrance / Techno-Spiritual",
        stream_url:"https://stream.laut.fm/psytrancelicious", format:"audio/mpeg",
        laut_slug:"psytrancelicious",
        blurb:"The network's flagship psytrance channel — continuous techno-spiritual radio." },
      { id:"ctp-02", name:"CTP Cosmic Radio", genre:"Cosmic / Electronic",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"Wide-orbit electronic: the sound of the CTPVerse at cruising altitude." },
      { id:"ctp-03", name:"CTP-EOS Linux Stream", genre:"CTP-EOS / Music & Talk",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"The disclosure Linux gets a soundtrack — CTP-EOS sessions and sounds." },
      { id:"ctp-04", name:"CTP Ambient Chill", genre:"Ambient / Chill",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"Slow fields and deep space: ambient for the come-down and the workbench." },
      { id:"ctp-05", name:"CTP Ambient & C-Domain", genre:"Ambient / Electronic",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"C-domain frequencies — ambient transmissions from behind the physical layer." },
      { id:"ctp-06", name:"Synthwave 80s CTP", genre:"Synthwave / Retro",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"Chrome, neon and arpeggios: the eighties, CTP style." },
      { id:"ctp-07", name:"CTP Disclosure Talk", genre:"Talk / Disclosure",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"Disclosure as CTP defines it: consciousness, conscience and the nature of reality." },
      { id:"ctp-08", name:"CTP Conscious Science", genre:"Science / Talk",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"CTPSci on air — the nomenclature and linguistics of the new science, conversationally." },
      { id:"ctp-09", name:"Metal Militia CTP", genre:"Metal / Industrial",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"Heavy current: metal and industrial pressure for the other end of the spectrum." },
      { id:"ctp-10", name:"Classical CTP", genre:"Classical / Crossover",
        stream_url:"", format:"audio/mpeg", laut_slug:"",
        blurb:"The old masters at full spectrum — classical works through a CTP lens." }
    ]
  };

  function byId(id){ return document.getElementById(id); }
  function channelById(id){
    for (var i=0;i<DIRECTORY.channels.length;i++) if (DIRECTORY.channels[i].id===id) return DIRECTORY.channels[i];
    return null;
  }

  /* ---------- Build the left channel menu ---------- */
  var chanMenu = byId('chanMenu');
  DIRECTORY.channels.forEach(function(ch){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chan-btn'; b.dataset.channel = ch.id;
    b.setAttribute('aria-label', 'Load ' + ch.name + ' into the player');
    var dot = document.createElement('span');
    dot.className = ch.stream_url ? 'live-dot' : 'pend-dot'; dot.setAttribute('aria-hidden','true');
    var txt = document.createElement('span');
    var nm = document.createElement('span'); nm.className='nm'; nm.textContent = ch.name;
    var gn = document.createElement('span'); gn.className='gn'; gn.textContent = ch.genre;
    txt.appendChild(nm); txt.appendChild(gn);
    b.appendChild(dot); b.appendChild(txt);
    b.addEventListener('click', function(){ loadChannel(ch.id, true); });
    chanMenu.appendChild(b);
  });

  /* ---------- Build the Radio Wall ---------- */
  var wall = byId('chanWall');
  DIRECTORY.channels.forEach(function(ch){
    var card = document.createElement('button');
    card.type = 'button'; card.className = 'chan-card'; card.dataset.channel = ch.id;
    card.setAttribute('aria-label', 'Open the player for ' + ch.name);
    var cn = document.createElement('span'); cn.className='cn'; cn.textContent = ch.name;
    var cg = document.createElement('span'); cg.className='cg'; cg.textContent = ch.genre;
    var cb = document.createElement('span'); cb.className='cg'; cb.textContent = ch.blurb;
    var cs = document.createElement('span');
    cs.className = 'cs ' + (ch.stream_url ? 'cs-live' : 'cs-pend');
    cs.textContent = ch.stream_url ? '● Live stream — open player' : '○ Coming soon';
    card.appendChild(cn); card.appendChild(cg); card.appendChild(cb); card.appendChild(cs);
    card.addEventListener('click', function(){ loadChannel(ch.id, true); });
    wall.appendChild(card);
  });

  /* ---------- The player is the CTP Music module (laut.fm widget) ----------
     The old custom <audio> player is gone — one player only. Clicking a
     channel in the left menu, the Radio Wall, or a Listen Live button
     switches the widget to that channel's laut.fm station (if it has one)
     and scrolls the module into view. Channels with no stream yet do
     nothing but highlight. */
  function loadChannel(id, autoplay){
    var ch = channelById(id);
    if (!ch) return;
    var nodes = document.querySelectorAll('[data-channel]');
    for (var i=0;i<nodes.length;i++) nodes[i].classList.toggle('active', nodes[i].dataset.channel === id);
    if (ch.laut_slug && window.CTPMusicLoad){
      window.CTPMusicLoad(ch.laut_slug);
      var mod = document.getElementById('ctp-music');
      if (mod) mod.scrollIntoView({ behavior:'smooth', block:'start' });
    }
  }

  /* Listen Live / featured buttons */
  var jump = document.querySelectorAll('[data-play-channel]');
  for (var j=0;j<jump.length;j++){
    jump[j].addEventListener('click', function(){ loadChannel(this.dataset.playChannel, true); });
  }

  /* ---------- Community poll (this session only) ---------- */
  var pollCounts = { "Psytrance":0, "IDM":0, "Ambient":0, "Synthwave":0, "Industrial":0, "Dark Ambient":0 };
  var voted = false;
  byId('pollForm').addEventListener('submit', function(e){
    e.preventDefault();
    var msg = byId('pollMsg');
    var sel = document.querySelector('input[name="subgenre"]:checked');
    if (!sel){ msg.textContent = 'Pick a subgenre first.'; return; }
    if (voted){ msg.textContent = 'You already voted in this session.'; return; }
    voted = true;
    pollCounts[sel.value] += 1;
    var total = 0, k;
    for (k in pollCounts) total += pollCounts[k];
    var res = byId('pollResults');
    res.innerHTML = ''; res.hidden = false;
    for (k in pollCounts){
      var pct = total ? Math.round(pollCounts[k] / total * 100) : 0;
      var row = document.createElement('div'); row.className = 'poll-row';
      var head = document.createElement('div'); head.className = 'pr-head';
      var name = document.createElement('span'); name.textContent = k + (sel.value === k ? ' — your vote' : '');
      var pc = document.createElement('span'); pc.textContent = pct + '%';
      head.appendChild(name); head.appendChild(pc);
      var bar = document.createElement('div'); bar.className = 'poll-bar';
      var fill = document.createElement('i'); fill.style.width = pct + '%';
      bar.appendChild(fill);
      row.appendChild(head); row.appendChild(bar);
      res.appendChild(row);
    }
    msg.textContent = 'Vote counted — thanks.';
    var inputs = document.querySelectorAll('input[name="subgenre"]');
    for (var i=0;i<inputs.length;i++) inputs[i].disabled = true;
  });

})();
