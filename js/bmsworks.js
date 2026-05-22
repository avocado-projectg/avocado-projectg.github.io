(function () {
	"use strict";

	const works = [
		{
			slug: "corona",
			title: "Corona",
			genre: "Trance",
			format: "OGG+WMV",
			download: "https://drive.google.com/file/d/1HWh6HSiGv6VK90uMJzH5NKp3iRUa9BSq/view?usp=sharing"
		},
		{
			slug: "midnight-flux",
			title: "Midnight Flux",
			genre: "Midnight Liquid Juke",
			format: "OGG+WMV",
			download: "https://drive.google.com/file/d/1ulImKUntbH6ijGmEkxcHdi_-jbLDGtY8/view?usp=sharing"
		},
		{
			slug: "the-sundering",
			title: "The Sundering",
			genre: "Upheaval",
			format: "WAV+WMV",
			download: "https://drive.google.com/file/d/1QLJBDgQUGa4vruaX1J7Z_y56dnkqz9s3/view?usp=sharing"
		},
		{
			slug: "theme",
			title: "Theme",
			genre: "G-Bass",
			format: "OGG+WMV",
			download: "https://drive.google.com/file/d/1UwV41iitTwYYKFVi46aL0uB2q_QyO3Yz/view?usp=sharing"
		},
		{
			slug: "aliens-are-bad",
			title: "Aliens are BAD!",
			genre: "Nan-Madol Festival",
			format: "OGG+WMV",
			download: "https://drive.google.com/file/d/1BYAf3vhy2bTpxRxbrpsogoUXlerH0w8o/view?usp=sharing"
		},
		{
			slug: "fake-life",
			title: "Fake Life",
			genre: "FAKE SKOOL TECHSTEP",
			format: "OGG+WMV",
			download: "https://drive.google.com/file/d/1l9o1Lk1d1szPQNjWqHWeMK9k5OxlZwo0/view?usp=sharing"
		},
		{
			slug: "the-observer",
			title: "The Observer",
			genre: "absurd crossbreed",
			format: "OGG+WMV",
			download: "https://drive.google.com/file/d/1ZqQRMp1k-yJ0Kc1rdiiFMb2XNgNAUMHC/view?usp=sharing"
		},
		{
			slug: "g-bass",
			title: "G-Bass",
			genre: "ProjectG",
			format: "WAV",
			download: "https://drive.google.com/file/d/17ShF1V9XyKI1X67axqf3a7DuBBVa2a21/view?usp=sharing"
		},
		{
			slug: "midnight-flux-asmr",
			title: "Midnight Flux?",
			genre: "ASMR",
			format: "WAV",
			download: "https://drive.google.com/file/d/1bUeCtEgwJ9jdRWSuu8AZysbWZiFUJ_dT/view?usp=sharing"
		}
	];

	const detailEl = document.querySelector("#work-detail");
	const links = Array.from(document.querySelectorAll(".work-link"));

	function escapeHtml(value) {
		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function findWork(slug) {
		return works.find(function (work) {
			return work.slug === slug;
		});
	}

	function setActive(slug) {
		links.forEach(function (link) {
			link.classList.toggle("work-link-active", link.dataset.work === slug);
		});
	}

	function renderWork(work) {
		if (!work) {
			detailEl.innerHTML = '<p class="work-status">Select a title to view details.</p>';
			setActive("");
			return;
		}

		detailEl.innerHTML =
			'<header class="work-header">' +
			"<h1>" + escapeHtml(work.title) + "</h1>" +
			"</header>" +
			'<dl class="work-meta">' +
			"<dt>Genre</dt>" +
			"<dd>" + escapeHtml(work.genre) + "</dd>" +
			"<dt>Format</dt>" +
			"<dd>" + escapeHtml(work.format) + "</dd>" +
			"</dl>" +
			'<p><a href="' + escapeHtml(work.download) + '">Download</a></p>';
		setActive(work.slug);
	}

	links.forEach(function (link) {
		link.addEventListener("click", function (event) {
			const work = findWork(link.dataset.work);
			event.preventDefault();
			if (!work) {
				return;
			}

			history.replaceState(null, "", "#" + work.slug);
			renderWork(work);
		});
	});

	renderWork(findWork(window.location.hash.slice(1)));
}());
