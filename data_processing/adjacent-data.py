"""
# Adjacent Country

* [wiki](https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders)
* [github-adjacency](https://github.com/P1sec/country_adjacency)
  - only 168 entries, unable to match with
"""
from __future__ import print_function
import re
import json

from bs4 import BeautifulSoup
import pycountry
import data

regex_square_bracket = r"\[\d+\]"
regex_bracket = r"\(.+\)"


def clean(s):
  return s.replace(u'\xa0', u' ').strip()


def read_tag_and_siblings_until_br(tag):
  s = tag.text

  tag = tag.next_sibling
  while tag is not None:
    if tag.name == 'br':
      break

    el_str = tag.string
    if el_str:
      s += ' ' + el_str

    tag = tag.next_sibling

  return clean(s)


def get_country_neighbors():
  """
  Returns a JSON dictionary of countries and their
  land neighbors, using full nation names

  Source: https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders

  :return: [
    {
      "country": "Germany",
      "neighbours": [
        "Austria",
        "Belgium",
        "Czech Republic",
        "Denmark",
        "France",
        "Luxembourg",
        "Netherlands",
        "Poland",
        "Switzerland"
      ]
    },
    ...
  ]
  """
  html_doc = 'data/adjacency/wiki.html'
  soup = BeautifulSoup(open(html_doc).read(), 'html.parser')

  table = soup.find_all('table')[0]
  tbody = table.tbody

  tr_list = tbody.find_all('tr')

  entries = []

  for tr in tr_list:
    td_list = tr.find_all('td')
    if len(td_list) == 0:
      continue

    entry = {}

    td = td_list[0]
    s = read_tag_and_siblings_until_br(td.b)
    s = re.sub(regex_bracket, '', s)
    s = re.sub(regex_square_bracket, '', s)
    entry["country"] = clean(s)

    entry["neighbours"] = []
    for tag in td_list[4].find_all('span'):

      if re.search(regex_square_bracket, tag.text):
        continue

      s = read_tag_and_siblings_until_br(tag)
      s = re.sub(regex_square_bracket, '', s)

      # skip (M) - maritime border only
      if '(M)' in s:
        continue

      # Look for (L) - land border or nothing - both land/maritime
      s = s.replace('(L)', '').strip()
      entry["neighbours"].append(s)

    entries.append(entry)

  return entries


countryinfo = data.get_countryinfo()

corrections = {
    "Macedonia": "Macedonia",
    "Czech": "Czechia",
    "Côte": "Ivory Coast",
    "Cyprus": "Cyprus",
    "Denmark": "Denmark",
    "Netherlands": "Netherlands",
    "New Zealand": "New Zealand",
    "Norway": "Norway",
    "Macau": "Macao"
}


def is_match(country_name):
  for country in countryinfo:
    if country["Country"] == country_name:
      return country
  return None


def get_code(name):
  country = is_match(name)
  if country:
    return country["ISO-Numeric"]
  else:
    for key, value in corrections.items():
      if key in name:
        country = is_match(value)
        if country:
          return country["ISO-Numeric"]
  return None


def check_names():
  entries = get_country_neighbors()
  names = []
  for entry in entries:
    names.append(entry['country'])
    for name in entry['neighbours']:
      if name not in names:
        names.append(name)
  for name in names:
    code = get_code(name)
    if code:
      print(":", name, "=", int(code))
    else:
      print("  :():", name)
  # print(json.dumps(entries, indent=2))


def make_data_js(data_js_fname):
  out_data = {'neighbours': []}
  entries = get_country_neighbors()
  for entry in entries:

    out_entry = {
        'country': get_code(entry['country']),
        'neighbours': list(map(get_code,
                               entry['neighbours']))
    }
    out_data['neighbours'].append(out_entry)
  data.make_data_js(data_js_fname, out_data)


make_data_js('adjacent-data.js')
