const axios = require("axios");
const { load } = require("cheerio");

const BASE_URL = 'https://komikstation.co';

const routes = {
  popular: (page) => `${BASE_URL}/manga/?page=${page}&type=manhwa&order=popular`,
  new: () => BASE_URL,
  genre: (genre, page) => `${BASE_URL}/genres/${genre}/page/${page}`,
  search: (query, page) => `${BASE_URL}/page/${page}/?s=${query}`,
  manhwaDetail: (query) => `${BASE_URL}/manga/${query}`,
  ongoing: (page) => `${BASE_URL}/manga/?page=${page}&status=ongoing&type=manhwa`
};

const extractSeriesList = ($) =>
  $(".bs")
    .map((_, element) => {
      const bsx = $(element).find(".bsx");
      return {
        title: bsx.find("a").attr("title"),
        url: bsx.find("a").attr("href"),
        image: bsx.find("img").attr("src"),
        latestChapter: bsx.find(".epxs").text(),
        rating: bsx.find(".numscore").text(),
      };
    })
    .get();

const extractPagination = ($) => {
  const pages = $('.pagination').map((_, paginationEl) => {
    return $(paginationEl).children().map((_, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      const isCurrentPage = $element.hasClass('current');
      
      if (text.includes('Berikutnya') || text.includes('Sebelumnya')) {
        return null;
      }

      return {
        pageUrl: isCurrentPage ? null : $element.attr('href'),
        pageNumber: text,
        isCurrent: isCurrentPage
      };
    }).get();
  }).get()[0] || [];

  const nextPage = $('.pagination .next').attr('href');
  
  return {
    pages,
    hasNextPage: !!nextPage,
    nextPageUrl: nextPage
  };
};

const extractOngoingPagination = ($) => {
  const hpage = $("#content > div > div.postbody > div.bixbox.seriesearch > div.mrgn > div.hpage");
  
  return {
    currentPage: parseInt(hpage.find('a.l').text()) || 1,
    nextPage: hpage.find('a.r').length > 0 ? parseInt(hpage.find('a.r').text()) : null,
    hasNextPage: hpage.find('a.r').length > 0,
    hasPrevPage: hpage.find('a.l').length > 0
  };
};

async function scrapeWebsite(url, extractionFn) {
  try {
    const { data } = await axios.get(url);
    const $ = load(data);
    return extractionFn($);
  } catch (error) {
    if (error.response?.status === 404) {
      throw { status: 404, message: "Page not found" };
    }
    throw { status: 500, message: "Internal Server Error" };
  }
}

const manhwaController = {
  getPopular: async (req) => {
    const page = req.query.page || 1;
    return scrapeWebsite(routes.popular(page), ($) => ({
      seriesList: $(".bs").map((_, element) => ({
        title: $(element).find(".tt").text().trim(),
        chapter: $(element).find(".epxs").text().trim(),
        rating: $(element).find(".numscore").text().trim(),
      })).get()
    }));
  },

  getNew: async () => {
    return scrapeWebsite(routes.new(), ($) => ({
      seriesList: $(".utao").map((_, element) => ({
        title: $(element).find(".luf h4").text().trim(),
        link: $(element).find(".luf a.series").attr("href"),
        imageSrc: $(element).find(".imgu img").attr("src"),
      })).get()
    }));
  },

  getByGenre: async (req) => {
    const { genre } = req.params;
    const page = req.query.page || 1;
    return scrapeWebsite(routes.genre(genre, page), ($) => ({
      seriesList: extractSeriesList($),
      pagination: extractPagination($),
    }));
  },

  search: async (req) => {
    const { query } = req.params;
    const page = req.query.page || 1;
    return scrapeWebsite(routes.search(query, page), ($) => ({
      seriesList: extractSeriesList($),
      pagination: extractPagination($),
    }));
  },

  getManhwaDetail: async (req) => {
    const { query } = req.params;
    return scrapeWebsite(routes.manhwaDetail(query), ($) => {
      const chapters = $('#chapterlist li').map((_, el) => ({
        chapterNum: $(el).find('.chapternum').text().trim(),
        chapterLink: $(el).find('.eph-num a').attr('href'),
        chapterDate: $(el).find('.chapterdate').text().trim(),
        downloadLink: $(el).find('.dload').attr('href'),
      })).get();
      
      const genres = $('.mgen a').map((_, el) => ({
        genreName: $(el).text().trim(),
        genreLink: $(el).attr('href'),
      })).get();
      
      return {
        title: $('.infox .entry-title').text().trim(),
        imageSrc: $('.thumb img').attr('src'),
        rating: $('.rating .num').text().trim(),
        followedBy: $('.bmc').text().trim(),
        synopsis: $('.entry-content.entry-content-single').text().trim(),
        firstChapter: {
          title: $('.lastend .inepcx').first().find('.epcurfirst').text().trim(),
          link: $('.lastend .inepcx').first().find('a').attr('href'),
        },
        latestChapter: {
          title: $('.lastend .inepcx').last().find('.epcurlast').text().trim(),
          link: $('.lastend .inepcx').last().find('a').attr('href'),
        },
        status: $('.tsinfo .imptdt').eq(0).find('i').text().trim(),
        type: $('.tsinfo .imptdt').eq(1).find('a').text().trim(),
        released: $('.fmed').eq(0).find('span').text().trim(),
        author: $('.fmed').eq(1).find('span').text().trim(),
        artist: $('.fmed').eq(2).find('span').text().trim(),
        updatedOn: $('.fmed').eq(3).find('time').text().trim(),
        genres,
        chapters,
      };
    });
  },

  getOngoing: async (req) => {
    const page = req.query.page || 1;
    return scrapeWebsite(routes.ongoing(page), ($) => ({
      seriesList: extractSeriesList($),
      pagination: extractOngoingPagination($)
    }));
  }
};

module.exports = manhwaController;