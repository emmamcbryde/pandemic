"""
# Adjacent Country

* [wiki](https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders)
* [github-adjacency](https://github.com/P1sec/country_adjacency)
  - only 168 entries, unable to match with
"""
from __future__ import print_function
import re
import json
import csv

from bs4 import BeautifulSoup
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


def get_code(name, country_key="ISO-Numeric"):
  country = is_match(name)
  if country:
    return country[country_key]
  else:
    for key, value in corrections.items():
      if key in name:
        country = is_match(value)
        if country:
          return country[country_key]
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
    country_code = get_code(entry['country'])
    if country_code is None:
      continue
    neighbor_codes = list(
        filter(
            lambda v: v is not None,
            map(get_code,
                entry['neighbours'])))
    out_entry = {
        'country': country_code,
        'neighbours': neighbor_codes
    }
    out_data['neighbours'].append(out_entry)
  data.make_data_js(data_js_fname, out_data)


code_str = "AFG	ALB	DZA	ASM	AND	AGO	AIA	ATA	ATG	ARG	ARM	ABW	AUS	AUT	AZE	BHS	BHR	BGD	BRB	BLR	BEL	BLZ	BEN	BMU	BTN	BOL	BIH	BWA	BRA	IOT	BRN	BGR	BFA	BDI	KHM	CMR	CAN	CPV	CYM	CAF	TCD	CHL	CHN	CXR	CCK	COL	COM	COG	COD	COK	CRI	CIV	HRV	CUB	CYP	CZE	DNK	DJI	DMA	DOM	ECU	EGY	SLV	GNQ	ERI	EST	ETH	FLK	FRO	FJI	FIN	FRA	GUF	PYF	ATF	GAB	GMB	GEO	DEU	GHA	GIB	GRC	GRL	GRD	GLP	GUM	GTM	GGY	GIN	GNB	GUY	HTI	VAT	HND	HKG	HUN	ISL	IND	IDN	IRN	IRQ	IRL	IMN	ISR	ITA	JAM	JPN	JEY	JOR	KAZ	KEN	KIR	PRK	KOR	KWT	KGZ	LAO	LVA	LBN	LSO	LBR	LBY	LIE	LTU	LUX	MAC	MKD	MDG	MWI	MYS	MDV	MLI	MLT	MHL	MTQ	MRT	MUS	MYT	MEX	FSM	MDA	MCO	MNG	MNE	MSR	MAR	MOZ	MMR	NAM	NRU	NPL	NLD	ANT	NCL	NZL	NIC	NER	NGA	NIU	NFK	MNP	NOR	OMN	PAK	PLW	PSE	PAN	PNG	PRY	PER	PHL	PCN	POL	PRT	PRI	QAT	REU	ROU	RUS	RWA	SHN	KNA	LCA	SPM	VCT	WSM	SMR	STP	SAU	SEN	SRB	SYC	SLE	SGP	SVK	SVN	SLB	SOM	ZAF	SGS	ESP	LKA	SDN	SUR	SJM	SWZ	SWE	CHE	SYR	TWN	TJK	TZA	THA	TLS	TGO	TKL	TON	TTO	TUN	TUR	TKM	TCA	TUV	UGA	UKR	ARE	GBR	USA	URY	UZB	VUT	VEN	VNM	VGB	VIR	WLF	ESH	YEM	ZMB	ZWE"

alpha3_list = code_str.split()


def make_csv(csv_name):
  out_data = {'neighbours': []}
  entries = get_country_neighbors()
  for entry in entries:
    country_code = get_code(entry['country'], "ISO3")
    if country_code is None:
      continue
    neighbor_codes = list(
      filter(
        lambda v: v is not None,
        map(
          lambda v: get_code(v, "ISO3"),
          entry['neighbours'])))
    out_entry = {
        'country': country_code,
        'neighbours': neighbor_codes
    }
    out_data['neighbours'].append(out_entry)

  with open('adjacent_countries.json', 'w') as f:
    json.dump(out_data, f, indent=2)

  rows = []
  entries = out_data['neighbours']
  n_country = len(alpha3_list)
  rows.append(['Country'] + alpha3_list)
  for alpha3 in alpha3_list:
    row = [alpha3]
    for entry in entries:
      if entry['country'] == alpha3:
        print(alpha3, entry['neighbours'])
        for neighbour_alpha3 in alpha3_list:
          if neighbour_alpha3 in entry['neighbours']:
            row.append(1)
          else:
            row.append(0)
        break
    else:
      print(alpha3, 'missing')
      row += [0] * n_country
    rows.append(row)

  with open(csv_name, 'w') as csvfile:
    spamwriter = csv.writer(
        csvfile,
        delimiter=',',
        quotechar='|',
        quoting=csv.QUOTE_MINIMAL)
    for row in rows:
      spamwriter.writerow(row)


make_data_js('adjacent-data.js')

make_csv('adjacenct_countries.csv')
