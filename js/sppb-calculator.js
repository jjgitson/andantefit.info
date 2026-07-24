/* ────────────────────────────────────────────────────────────────────────────
   Interactive SPPB score calculator
   Reads localized band definitions from an inline <script type="application/json"
   id="calcBands"> block, so the same logic serves every language version.
   Progressively enhanced: if JS is off, the static scoring tables still apply.
   ──────────────────────────────────────────────────────────────────────────── */
(function () {
  function init() {
    var root = document.getElementById('sppbCalc');
    var bandsEl = document.getElementById('calcBands');
    if (!root || !bandsEl) return;

    var bands;
    try {
      bands = JSON.parse(bandsEl.textContent);
    } catch (e) {
      return; // malformed band data — leave the static tables as the fallback
    }

    var scores = { balance: null, gait: null, chair: null };

    root.querySelectorAll('.calc-seg').forEach(function (seg) {
      var key = seg.getAttribute('data-calc-input');
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-val]');
        if (!btn) return;
        seg.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        scores[key] = parseInt(btn.getAttribute('data-val'), 10);
        update();
      });
    });

    function update() {
      if (scores.balance === null || scores.gait === null || scores.chair === null) return;
      var total = scores.balance + scores.gait + scores.chair;
      var band = bands.find(function (b) { return total <= b.max; }) || bands[bands.length - 1];

      var totalEl = document.getElementById('calcTotal');
      var bandEl = document.getElementById('calcBand');
      var interpEl = document.getElementById('calcInterp');
      var resultEl = document.getElementById('calcResult');

      if (totalEl) totalEl.textContent = total;
      if (bandEl) {
        bandEl.textContent = band.label;
        bandEl.className = 'calc-band tone-' + (band.tone || 'mid');
      }
      if (interpEl) interpEl.textContent = band.interp;
      if (resultEl) {
        resultEl.hidden = false;
        // Only scroll into view once, when the result first appears.
        if (!resultEl.dataset.revealed) {
          resultEl.dataset.revealed = '1';
          resultEl.setAttribute('tabindex', '-1');
        }
      }

      if (typeof window.afTrack === 'function') {
        window.afTrack('calc_complete', {
          sppb_total: total,
          sppb_band: band.tone,
          page_path: window.location.pathname
        });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
