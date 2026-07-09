(function () {
	"use strict";

	const discographyUrl = "data/discography.json";
	const listEl = document.querySelector("#discography-list");
	const detailEl = document.querySelector("#release-detail");
	const contentEl = document.querySelector("#content");
	const mainEl = document.querySelector(".site-main");
	const narrowPageQuery = window.matchMedia("(max-width: 720px)");
	const detailTransitionMs = 220;
	const detailLineDelayMs = 45;
	const mainTransitionMs = 220;
	const mainLineDelayMs = 38;
	let releases = [];
	let detailRenderToken = 0;
	let isInitialReleaseRender = true;
	let isMainNavigating = false;

	const windowLoaded = new Promise(function (resolve) {
		if (document.readyState === "complete") {
			resolve();
			return;
		}

		window.addEventListener("load", resolve, { once: true });
	});

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
				renderRelease(link.dataset.release).then(scrollToReleaseDetailOnNarrowPage);
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

	function waitForImages(container) {
		const images = Array.from(container.querySelectorAll("img")).filter(function (image) {
			return !image.complete;
		});

		if (!images.length) {
			return Promise.resolve();
		}

		return Promise.all(images.map(function (image) {
			return new Promise(function (resolve) {
				image.addEventListener("load", resolve, { once: true });
				image.addEventListener("error", resolve, { once: true });
			});
		}));
	}

	function animateDetail(keyframes) {
		if (!detailEl.animate) {
			return new Promise(function (resolve) {
				window.setTimeout(resolve, detailTransitionMs);
			});
		}

		stopDetailAnimations();
		const animation = detailEl.animate(keyframes, {
			duration: detailTransitionMs,
			easing: "ease",
			fill: "both"
		});

		return animation.finished.catch(function () {});
	}

	function getDetailFadeItems() {
		return Array.from(detailEl.querySelectorAll(
			".release-cover, .release-header h1, .release-header p, .release-header time, .release-tracklist h2, .release-tracklist li, .release-links h2, .release-links li"
		));
	}

	function clearDetailItemStyles() {
		getDetailFadeItems().forEach(function (item) {
			item.style.opacity = "";
			item.style.transform = "";
		});
	}

	function animateDetailLinesIn() {
		const items = getDetailFadeItems();

		if (!items.length) {
			return Promise.resolve();
		}

		if (!detailEl.animate) {
			clearDetailItemStyles();
			return Promise.resolve();
		}

		const animations = items.map(function (item, index) {
			const animation = item.animate([
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" }
			], {
				delay: index * detailLineDelayMs,
				duration: detailTransitionMs,
				easing: "ease",
				fill: "both"
			});

			return animation.finished.catch(function () {});
		});

		return Promise.all(animations).then(function () {
			stopDetailAnimations();
			clearDetailItemStyles();
		});
	}

	function hideDetailFadeItems() {
		getDetailFadeItems().forEach(function (item) {
			item.style.opacity = "0";
			item.style.transform = "translateY(6px)";
		});
	}

	function stopDetailAnimations() {
		if (!detailEl.getAnimations) {
			clearDetailItemStyles();
			return;
		}

		detailEl.getAnimations().forEach(function (animation) {
			animation.cancel();
		});
		clearDetailItemStyles();
	}

	function getMainFadeItems() {
		return Array.from(mainEl.querySelectorAll(
			"#about h1, #about h2, #about p, #discography h1, #discography h2, .discography-item, #contact h1, #contact p, #link h1, .social-links li"
		));
	}

	function hideMainFadeItems() {
		getMainFadeItems().forEach(function (item) {
			item.style.opacity = "0";
			item.style.transform = "translateY(6px)";
		});
	}

	function clearMainItemStyles() {
		getMainFadeItems().forEach(function (item) {
			item.style.opacity = "";
			item.style.transform = "";
		});
	}

	function stopMainAnimations() {
		if (!mainEl.getAnimations) {
			clearMainItemStyles();
			return;
		}

		mainEl.getAnimations({ subtree: true }).forEach(function (animation) {
			animation.cancel();
		});
		clearMainItemStyles();
	}

	function animateMainLinesIn() {
		const items = getMainFadeItems();

		if (!items.length) {
			return Promise.resolve();
		}

		if (!mainEl.animate) {
			clearMainItemStyles();
			return Promise.resolve();
		}

		const animations = items.map(function (item, index) {
			const animation = item.animate([
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" }
			], {
				delay: index * mainLineDelayMs,
				duration: mainTransitionMs,
				easing: "ease",
				fill: "both"
			});

			return animation.finished.catch(function () {});
		});

		return Promise.all(animations).then(function () {
			stopMainAnimations();
		});
	}

	function getPageExitElements() {
		return [mainEl, detailEl].filter(function (element) {
			return Boolean(element);
		});
	}

	function stopPageExitAnimations() {
		getPageExitElements().forEach(function (element) {
			if (!element.getAnimations) {
				return;
			}

			element.getAnimations({ subtree: true }).forEach(function (animation) {
				animation.cancel();
			});
		});
	}

	function clearPageExitStyles() {
		getPageExitElements().forEach(function (element) {
			element.style.opacity = "";
			element.style.transform = "";
		});
	}

	function animatePageOut() {
		stopPageExitAnimations();
		stopMainAnimations();
		stopDetailAnimations();
		clearPageExitStyles();

		if (!mainEl.animate) {
			getPageExitElements().forEach(function (element) {
				element.style.opacity = "0";
				element.style.transform = "translateY(8px)";
			});

			return new Promise(function (resolve) {
				window.setTimeout(resolve, mainTransitionMs);
			});
		}

		const animations = getPageExitElements().map(function (element, index) {
			const animation = element.animate([
				{ opacity: 1, transform: "translateY(0)" },
				{ opacity: 0, transform: "translateY(8px)" }
			], {
				delay: index * 35,
				duration: mainTransitionMs + 80,
				easing: "cubic-bezier(0.33, 1, 0.68, 1)",
				fill: "both"
			});

			return animation.finished.catch(function () {});
		});

		return Promise.all(animations);
	}

	function shouldAnimateMainNavigation(event, link) {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey ||
			link.classList.contains("discography-link") ||
			link.target ||
			link.hasAttribute("download")
		) {
			return false;
		}

		const url = new URL(link.href, window.location.href);
		const currentUrl = new URL(window.location.href);
		return url.origin === currentUrl.origin &&
			(url.pathname !== currentUrl.pathname || url.search !== currentUrl.search);
	}

	function setupMainNavigationAnimation() {
		Array.from(contentEl.querySelectorAll("a")).forEach(function (link) {
			link.addEventListener("click", function (event) {
				if (isMainNavigating || !shouldAnimateMainNavigation(event, link)) {
					return;
				}

				event.preventDefault();
				isMainNavigating = true;
				animatePageOut().then(function () {
					window.location.href = link.href;
				});
			});
		});
	}

	function restorePageAfterHistoryReturn() {
		isMainNavigating = false;
		stopPageExitAnimations();
		stopMainAnimations();
		stopDetailAnimations();
		clearPageExitStyles();
		document.documentElement.classList.remove("is-loading");
		document.documentElement.classList.add("is-ready");
	}

	function scrollToReleaseDetailOnNarrowPage() {
		if (!narrowPageQuery.matches || !detailEl.innerHTML) {
			return;
		}

		detailEl.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}

	function revealPage() {
		return windowLoaded.then(function () {
			return waitForImages(document);
		}).then(function () {
			hideMainFadeItems();
			document.documentElement.classList.remove("is-loading");
			document.documentElement.classList.add("is-ready");
			return animateMainLinesIn();
		});
	}

	function updateReleaseDetail(markup, slug) {
		const token = ++detailRenderToken;
		const hadDetail = Boolean(detailEl.innerHTML);
		const shouldAnimate = !isInitialReleaseRender && (hadDetail || markup);
		isInitialReleaseRender = false;

		function replaceDetail(hideBeforeImageLoad) {
			if (token !== detailRenderToken) {
				return Promise.resolve();
			}

			stopDetailAnimations();
			detailEl.innerHTML = markup;
			setActive(slug);

			if (hideBeforeImageLoad && markup) {
				hideDetailFadeItems();
			}

			return waitForImages(detailEl);
		}

		if (!shouldAnimate) {
			return replaceDetail(false);
		}

		if (!hadDetail) {
			return replaceDetail(true).then(function () {
				if (token !== detailRenderToken || !markup) {
					return null;
				}

				return animateDetailLinesIn();
			});
		}

		return animateDetail([
			{ opacity: 1, transform: "translateY(0)" },
			{ opacity: 0, transform: "translateY(6px)" }
		]).then(function () {
			return replaceDetail(true);
		}).then(function () {
			if (token !== detailRenderToken || !markup) {
				return null;
			}

			return animateDetailLinesIn();
		});
	}

	function renderRelease(slug) {
		const release = releases.find(function (item) {
			return item.slug === slug;
		});

		if (!release || !releaseHasDetail(release)) {
			return updateReleaseDetail("", "");
		}

		return updateReleaseDetail(
			(release.cover ? '<img class="release-cover" src="' + escapeHtml(release.cover) + '" alt="' + escapeHtml(release.title) + ' cover" />' : "") +
			'<header class="release-header">' +
			"<h1>" + escapeHtml(release.title) + "</h1>" +
			(release.subtitle ? "<p>" + escapeHtml(release.subtitle) + "</p>" : "") +
			(release.date ? '<time datetime="' + escapeHtml(release.date) + '">' + escapeHtml(release.date) + "</time>" : "") +
			"</header>" +
			renderTracklist(release.tracks) +
			renderLinks(release.links),
			slug
		);
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
			setupMainNavigationAnimation();
			return renderRelease(window.location.hash.slice(1));
		})
		.then(revealPage)
		.catch(function () {
			listEl.innerHTML = '<p class="discography-status">Discography could not be loaded.</p>';
			detailEl.innerHTML = "";
			revealPage();
		});

	window.addEventListener("pageshow", function (event) {
		if (event.persisted) {
			restorePageAfterHistoryReturn();
		}
	});
}());
