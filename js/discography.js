(function () {
	"use strict";

	const discographyUrl = "data/discography.json";
	const listEl = document.querySelector("#discography-list");
	const detailEl = document.querySelector("#release-detail");
	let releases = [];

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function groupByCategory(items) {
		return items.reduce(function (groups, release) {
			const category = release.category || "Other";
			if (!groups[category]) {
				groups[category] = [];
			}
			groups[category].push(release);
			return groups;
		}, {});
	}

	function releaseHasDetail(release) {
		return release.cover || release.subtitle || release.date || (release.tracks && release.tracks.length) || (release.links && release.links.length);
	}

	function setActive(slug) {
		Array.from(document.querySelectorAll(".discography-link")).forEach(function (link) {
			link.classList.toggle("discography-link-active", link.dataset.release === slug);
		});
	}

	function renderList() {
		const groups = groupByCategory(releases);
		const categories = Object.keys(groups);

		listEl.innerHTML = categories.map(function (category) {
			return "<h2>" + escapeHtml(category) + "</h2>" +
				'<ul class="discography-list">' +
				groups[category].map(function (release) {
					const style = release.color ? ' style="--discography-color: ' + escapeHtml(release.color) + '"' : "";
					const label = release.label ? " / " + escapeHtml(release.label) : "";
					const title = releaseHasDetail(release)
						? '<a class="discography-link" href="#' + encodeURIComponent(release.slug) + '" data-release="' + escapeHtml(release.slug) + '"><span class="discography-title">' + escapeHtml(release.title) + "</span></a>"
						: '<span class="discography-title">' + escapeHtml(release.title) + "</span>";

					return '<li class="discography-item"' +
						' data-title="' + escapeHtml(release.title) + '"' +
						' data-year="' + escapeHtml(release.year) + '"' +
						' data-label="' + escapeHtml(release.label) + '"' +
						' data-comment="' + escapeHtml(release.comment) + '"' +
						style +
						">" +
						title +
						label +
						"</li>";
				}).join("") +
				"</ul>";
		}).join("");

		Array.from(document.querySelectorAll(".discography-link")).forEach(function (link) {
			link.addEventListener("click", function (event) {
				event.preventDefault();
				history.replaceState(null, "", "#" + link.dataset.release);
				renderRelease(link.dataset.release);
			});
		});
	}

	function renderLinks(links) {
		if (!links || !links.length) {
			return "";
		}

		return '<section class="release-links">' +
			"<h2>Digital</h2>" +
			"<ul>" + links.map(function (link) {
				return '<li><a href="' + escapeHtml(link.url) + '">' + escapeHtml(link.label) + "</a></li>";
			}).join("") + "</ul>" +
			"</section>";
	}

	function renderTracklist(tracks) {
		if (!tracks || !tracks.length) {
			return "";
		}

		return '<section class="release-tracklist">' +
			"<h2>Tracklist</h2>" +
			"<ol>" + tracks.map(function (track) {
				return "<li>" + escapeHtml(track) + "</li>";
			}).join("") + "</ol>" +
			"</section>";
	}

	function renderRelease(slug) {
		const release = releases.find(function (item) {
			return item.slug === slug;
		});

		if (!release || !releaseHasDetail(release)) {
			detailEl.innerHTML = "";
			setActive("");
			return;
		}

		detailEl.innerHTML =
			(release.cover ? '<img class="release-cover" src="' + escapeHtml(release.cover) + '" alt="' + escapeHtml(release.title) + ' cover" />' : "") +
			'<header class="release-header">' +
			"<h1>" + escapeHtml(release.title) + "</h1>" +
			(release.subtitle ? "<p>" + escapeHtml(release.subtitle) + "</p>" : "") +
			(release.date ? '<time datetime="' + escapeHtml(release.date) + '">' + escapeHtml(release.date) + "</time>" : "") +
			"</header>" +
			renderTracklist(release.tracks) +
			renderLinks(release.links);
		setActive(slug);
	}

	fetch(discographyUrl)
		.then(function (response) {
			if (!response.ok) {
				throw new Error("Discography could not be loaded.");
			}
			return response.json();
		})
		.then(function (items) {
			releases = items;
			renderList();
			renderRelease(window.location.hash.slice(1));
		})
		.catch(function () {
			listEl.innerHTML = '<p class="discography-status">Discography could not be loaded.</p>';
			detailEl.innerHTML = "";
		});
}());
