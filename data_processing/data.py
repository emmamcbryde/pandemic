""" Read in OAGExcel for flight travel data to generate
a flight travel matrix.
"""

from __future__ import print_function
import json
import csv
import pprint

import numpy
import xlrd
import pycountry
import geopy


def make_unique_list(elements):
  result = []
  for e in elements:
    if e not in result:
      result.append(e)
  return result


def read_tsv_with_header(fname):
  result = []
  header = None
  with open(fname) as tsvin:
    tsvin = csv.reader(tsvin, delimiter='\t')
    for row in tsvin:
      if header is None:
        header = row
      else:
        result.append({k: v for k, v in zip(header, row)})
  return result


data_js_template = '''
define(function() {
  result = {{data}}
  return result
})
'''


def make_data_js(fname, data):
  out_text = data_js_template.replace('{{data}}', json.dumps(data))
  open(fname, 'w').write(out_text)


def symmetrize_matrix(matrix):
  """
    In-place averaging of elements to force a symmetric matrix
    :param matrix: numpy 2d square matrix
    """
  for i in range(matrix.shape[0]):
    for j in range(matrix.shape[1]):
      if i != j:
        val = 0.5 * (matrix[i][j] + matrix[j][i])
        matrix[i][j] = val
        matrix[j][i] = val


def get_country_coordinates(country_name):
  """
    Looks up country coordinates from internet

    :param country_name: string of standard country name
    :return: (latitutide, longitude)
    """
  geolocator = geopy.geocoders.Nominatim()
  location = geolocator.geocode(country_name)
  return location.latitude, location.longitude


def get_countryinfo():
  """
    Returns a list of country info
    https://github.com/openeventdata/CountryInfo

    :return: [
        {
            'Area(in sq km)': '7686850',
            'Capital': 'Canberra',
            'Continent': 'OC',
            'Country': 'Australia',
            'CurrencyCode': 'AUD',
            'CurrencyName': 'Dollar',
            'EquivalentFipsCode\n': '\n',
            'ISO': 'AU',
            'ISO-Numeric': '036',
            'ISO3': 'AUS',
            'Languages': 'en-AU',
            'Phone': '61',
            'Population': '21515754',
            'Postal Code Format': '####',
            'Postal Code Regex': '^(\\d{4})$',
            'fips': 'AS',
            'geonameid': '2077456',
            'neighbours': '',
            'tld': '.au'
        },...
    ]
    """
  result = []
  fname = 'data/countryinfo/countryinfo.txt'
  for line in open(fname):
    if line.startswith('#ISO'):
      tokens = line.split('\t')
      tokens[0] = tokens[0][1:]
      headings = tokens
    elif line.startswith('#'):
      pass
    elif len(line.strip()) == 0:
      pass
    else:
      entry = {
          key: value
          for key,
          value in zip(headings,
                       line.split('\t'))
      }
      result.append(entry)
  return result


def get_population_by_id():
  """
    Returns a dictionary of populations by country numeric Id's

    :return: {
        <int> country_iso_numeric_code: <int> population,
        ...
    }
    """
  population_by_id = {}
  for country in get_countryinfo():
    id = int(country['ISO-Numeric'])
    population = int(country['Population'])
    population_by_id[id] = population
  return population_by_id


def get_country_by_alpha2():
  """
    Returns a dictionary using alpha2 as key, and country info as value
    https://opendata.socrata.com/dataset/Country-List-ISO-3166-Codes-Latitude-Longitude/mnkm-8ram/data

    :return {
        'AU': {
            'Alpha-2 code': 'AU',
            'Alpha-3 code': 'AUS',
            'Country': 'Australia',
            'Icon': '',
            'Latitude (average)': '-27',
            'Longitude (average)': '133',
            'Numeric code': '36'
        },
        ...
    }
    """
  fname = 'data/countryinfo/Country_List_ISO_3166_Codes_Latitude_Longitude.csv'
  country_by_alpha2 = {}
  with open(fname) as f:
    reader = csv.DictReader(f)
    for row in reader:
      country_by_alpha2[row['Alpha-2 code']] = row
  return country_by_alpha2


def get_oag_flight_matrix():
  """
    Returns a travel matrix from OAG data

    :return (travel_matrix, alpha2_to_i)
        travel_matrix: [n_country x n_country] numpy matrix
        alpha2_from_i: dictionary of ISO-2 nation code from index to travel_matrix
    """
  oag_spreadsheet = 'data/oag/OAGinExcel.xlsx'
  wb = xlrd.open_workbook(oag_spreadsheet)
  sheet = wb.sheet_by_index(0)

  # get country codes from spreadsheet
  codes = make_unique_list(map(lambda c: c.value, sheet.col(1)[1:]))

  # run through conversion for non-standard 2 letter codes
  def get_alpha_2(code):
    return 'RU' if code == 'R1' or code == 'R2' else code

  unique_alpha_2 = make_unique_list(sorted(map(get_alpha_2, codes)))

  # generate unique index for country based on alphabetic 2 letter ISO code
  i_from_code = {
      code: unique_alpha_2.index(get_alpha_2(code))
      for code in codes
  }
  alpha2_from_i = {
      i: get_alpha_2(code)
      for code,
      i in i_from_code.items()
  }

  # grab travel matrix indexed to country ISO 2 letter code
  n_index = len(unique_alpha_2)
  travel_matrix = numpy.zeros((n_index, n_index))
  for i_row, row in enumerate(sheet.get_rows()):
    if i_row == 0:
      continue
    i_origin = i_from_code[row[1].value]
    i_dest = i_from_code[row[3].value]
    travel_matrix[i_origin][i_dest] += float(row[5].value)

  return travel_matrix, alpha2_from_i
