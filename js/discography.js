(function () {
	"use strict";

	const releases = {
		"loneliness-and-desire": {
			title: "Loneliness and Desire",
			subtitle: "Project-G's 1st Album",
			date: "2025-10-26",
			cover: "/assets/images/cover_lnd.jpg",
			tracks: [
				"Spark (Intro)",
				"Bornite",
				"For No Reason",
				"Lemma",
				"Awareness",
				"Humid Days",
				"Loneliness and Desire",
				"Underlined"
			],
			links: [
				{
					label: "dizzylab",
					url: "https://www.dizzylab.net/d/OSR0028/"
				},
				{
					label: "bandcamp",
					url: "https://omnisetrecords.bandcamp.com/album/loneliness-and-desire"
				}
			]
		}
	};

	const detailEl = document.querySelector("#release-detail");
	const links = Array.from(document.querySelectorAll(".discography-link"));

	function escapeHtml(value) {
		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function setActive(slug) {
		links.forEach(function (link) {
			link.classList.toggle("discography-link-active", link.dataset.release === slug);
		});
	}

	function renderRelease(slug) {
		const release = releases[slug];
		if (!release) {
			detailEl.innerHTML = "";
			setActive("");
			return;
		}

		detailEl.innerHTML =
			'<img class="release-cover" src="' + escapeHtml(release.cover) + '" alt="' + escapeHtml(release.title) + ' cover" />' +
			'<header class="release-header">' +
			"<h1>" + escapeHtml(release.title) + "</h1>" +
			"<p>" + escapeHtml(release.subtitle) + "</p>" +
			'<time datetime="' + escapeHtml(release.date) + '">' + escapeHtml(release.date) + "</time>" +
			"</header>" +
			'<section class="release-tracklist">' +
			"<h2>Tracklist</h2>" +
			"<ol>" + release.tracks.map(function (track) {
				return "<li>" + escapeHtml(track) + "</li>";
			}).join("") + "</ol>" +
			"</section>" +
			'<section class="release-links">' +
			"<h2>Digital</h2>" +
			"<ul>" + release.links.map(function (link) {
				return '<li>' + escapeHtml(link.label) + ': <a href="' + escapeHtml(link.url) + '">' + escapeHtml(link.url) + "</a></li>";
			}).join("") + "</ul>" +
			"</section>";
		setActive(slug);
	}

	links.forEach(function (link) {
		link.addEventListener("click", function (event) {
			event.preventDefault();
			history.replaceState(null, "", "#" + link.dataset.release);
			renderRelease(link.dataset.release);
		});
	});

	renderRelease(window.location.hash.slice(1));
}());
