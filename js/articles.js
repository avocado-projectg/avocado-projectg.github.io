(function () {
	"use strict";

	const listEl = document.querySelector(".article-list");
	const viewEl = document.querySelector("#article-view");
	const manifestUrl = "articles/index.json";

	function escapeHtml(value) {
		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function stripFrontMatter(markdown) {
		if (!markdown.startsWith("---")) {
			return markdown;
		}

		const end = markdown.indexOf("\n---", 3);
		if (end === -1) {
			return markdown;
		}

		return markdown.slice(end + 4).trimStart();
	}

	function renderInline(markdown) {
		const placeholders = [];
		let html = markdown.replace(/`([^`]+)`/g, function (_, code) {
			const token = "\u0000" + placeholders.length + "\u0000";
			placeholders.push("<code>" + escapeHtml(code) + "</code>");
			return token;
		});

		html = escapeHtml(html)
			.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
			.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
			.replace(/\*([^*]+)\*/g, "<em>$1</em>");

		placeholders.forEach(function (placeholder, index) {
			html = html.replace("\u0000" + index + "\u0000", placeholder);
		});

		return html;
	}

	function normalizeTitle(value) {
		return value.trim().replace(/\s+/g, " ").toLowerCase();
	}

	function renderMarkdown(markdown, title) {
		const lines = stripFrontMatter(markdown).replace(/\r\n/g, "\n").split("\n");
		const html = [];
		let paragraph = [];
		let listItems = [];
		let listTag = "ul";
		let quoteLines = [];
		let codeLines = [];
		let inCodeBlock = false;

		if (title && lines[0]) {
			const firstHeading = lines[0].match(/^#\s+(.+)$/);
			if (firstHeading && normalizeTitle(firstHeading[1]) === normalizeTitle(title)) {
				lines.shift();
			}
		}

		function flushParagraph() {
			if (!paragraph.length) {
				return;
			}

			html.push("<p>" + renderInline(paragraph.join(" ")) + "</p>");
			paragraph = [];
		}

		function flushList() {
			if (!listItems.length) {
				return;
			}

			html.push("<" + listTag + ">" + listItems.map(function (item) {
				return "<li>" + renderInline(item) + "</li>";
			}).join("") + "</" + listTag + ">");
			listItems = [];
			listTag = "ul";
		}

		function flushQuote() {
			if (!quoteLines.length) {
				return;
			}

			html.push("<blockquote><p>" + renderInline(quoteLines.join(" ")) + "</p></blockquote>");
			quoteLines = [];
		}

		function flushBlocks() {
			flushParagraph();
			flushList();
			flushQuote();
		}

		lines.forEach(function (line) {
			if (line.trim().startsWith("```")) {
				if (inCodeBlock) {
					html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
					codeLines = [];
					inCodeBlock = false;
				} else {
					flushBlocks();
					inCodeBlock = true;
				}
				return;
			}

			if (inCodeBlock) {
				codeLines.push(line);
				return;
			}

			if (!line.trim()) {
				flushBlocks();
				return;
			}

			const heading = line.match(/^(#{1,6})\s+(.+)$/);
			if (heading) {
				flushBlocks();
				const level = heading[1].length;
				html.push("<h" + level + ">" + renderInline(heading[2]) + "</h" + level + ">");
				return;
			}

			const listItem = line.match(/^[-*]\s+(.+)$/);
			if (listItem) {
				flushParagraph();
				flushQuote();
				if (listItems.length && listTag !== "ul") {
					flushList();
				}
				listTag = "ul";
				listItems.push(listItem[1]);
				return;
			}

			const orderedListItem = line.match(/^\d+\.\s+(.+)$/);
			if (orderedListItem) {
				flushParagraph();
				flushQuote();
				if (listItems.length && listTag !== "ol") {
					flushList();
				}
				listTag = "ol";
				listItems.push(orderedListItem[1]);
				return;
			}

			const quote = line.match(/^>\s?(.+)$/);
			if (quote) {
				flushParagraph();
				flushList();
				quoteLines.push(quote[1]);
				return;
			}

			flushList();
			flushQuote();
			paragraph.push(line.trim());
		});

		if (inCodeBlock) {
			html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
		}

		flushBlocks();
		return html.join("");
	}

	function articleUrl(article) {
		return article.file || "articles/" + article.slug + ".md";
	}

	function formatDate(value) {
		if (!value) {
			return "";
		}

		const date = new Date(value + "T00:00:00");
		if (Number.isNaN(date.getTime())) {
			return value;
		}

		return date.toLocaleDateString("en", {
			year: "numeric",
			month: "short",
			day: "numeric"
		});
	}

	function renderList(articles, activeSlug) {
		if (!articles.length) {
			listEl.innerHTML = '<p class="article-status">No articles published yet.</p>';
			return;
		}

		listEl.innerHTML = '<ul class="article-index">' + articles.map(function (article) {
			const href = "articles.html?article=" + encodeURIComponent(article.slug);
			const activeClass = article.slug === activeSlug ? " article-index-link-active" : "";
			const date = article.date ? '<time datetime="' + escapeHtml(article.date) + '">' + formatDate(article.date) + "</time>" : "";
			const summary = article.summary ? '<p class="article-summary">' + escapeHtml(article.summary) + "</p>" : "";

			return '<li><a class="article-index-link' + activeClass + '" href="' + href + '">' +
				"<span>" + escapeHtml(article.title) + "</span>" +
				date +
				summary +
				"</a></li>";
		}).join("") + "</ul>";
	}

	function renderArticle(article, markdown) {
		const date = article.date ? '<time datetime="' + escapeHtml(article.date) + '">' + formatDate(article.date) + "</time>" : "";
		viewEl.innerHTML =
			'<header class="article-header">' +
			"<h1>" + escapeHtml(article.title) + "</h1>" +
			date +
			"</header>" +
			'<div class="article-body">' + renderMarkdown(markdown, article.title) + "</div>";
		document.title = article.title + " - Project-G";
	}

	function renderError(message) {
		viewEl.innerHTML = '<p class="article-status">' + escapeHtml(message) + "</p>";
	}

	function loadArticle(articles) {
		const params = new URLSearchParams(window.location.search);
		const selectedSlug = params.get("article") || (articles[0] && articles[0].slug);
		const selectedArticle = articles.find(function (article) {
			return article.slug === selectedSlug;
		});

		renderList(articles, selectedSlug);

		if (!selectedArticle) {
			renderError("Article not found.");
			return;
		}

		fetch(articleUrl(selectedArticle))
			.then(function (response) {
				if (!response.ok) {
					throw new Error("Article file could not be loaded.");
				}
				return response.text();
			})
			.then(function (markdown) {
				renderArticle(selectedArticle, markdown);
			})
			.catch(function () {
				renderError("Article file could not be loaded.");
			});
	}

	fetch(manifestUrl)
		.then(function (response) {
			if (!response.ok) {
				throw new Error("Article index could not be loaded.");
			}
			return response.json();
		})
		.then(function (articles) {
			const sortedArticles = articles.slice().sort(function (a, b) {
				return String(b.date || "").localeCompare(String(a.date || ""));
			});
			loadArticle(sortedArticles);
		})
		.catch(function () {
			listEl.innerHTML = '<p class="article-status">Article index could not be loaded.</p>';
			renderError("Article index could not be loaded.");
		});
}());
